/**
 * Netcode host-autoritativo: snapshots del anfitrión, predicción local del invitado,
 * sondeo/envío de presencia y replicación de efectos.
 */
'use strict';

const NET = { mode: 'local', me: 0, room: null, ready: false, nr: null, code: '', draftId: 0,
  fx: [], fxSeq: 0, lastSend: 0,
  // host side
  guestPeer: '', guestSeen: 0, rY: H / 2, rActSeen: 0, rActPending: false, rSel: 0, rPick: -1,
  // guest side
  hostSeen: 0, joinAt: 0, lastFx: -1, lastSnapObj: null, actSeq: 0, mySel: 0, myPick: -1, lastRn: -1 };
function fxRec(a) {
  if (NET.mode !== 'host' || state === 'title') return;
  NET.fx.push([++NET.fxSeq, ...a]); if (NET.fx.length > 24) NET.fx.shift();
}

NET.room = makePeerRoom();
NET.ready = true;
const r1 = v => Math.round(v * 10) / 10, r0 = Math.round;
function snapshot() {
  return {
    st: state, rn: roundNum, m: mod.id, sv: r1(serveTimer), sl: r1(slowT), pa: paused ? 1 : 0, sh: r1(shake), fl: r1(flash),
    p: P.map(p => [r0(p.y), r0(p.h), p.score, p.rounds, p.lv, p.active || 0, r1(p.cd), r1(p.cdMax), r1(p.frozen), r1(p.wallT), p.smash ? 1 : 0, p.shield, r1(p.hitT), r0(p.speed), r0(p.vy)]),
    b: balls.map(b => [r0(b.x), r0(b.y), r0(b.vx), r0(b.vy), b.owner, b.ghost || 0, b.squash > 0 ? 1 : 0]),
    o: obstacles.map(o => r0(o.y)),
    ev: ev ? [ev.id, r1(ev.t), ev.dur, ev.sign] : 0,
    d: draft && state === 'draft' ? { o: draft.opts.map(a => a.map(c => c.id)), s: draft.sel, k: draft.done.map(x => x ? 1 : 0), l: draft.loser, id: NET.draftId } : 0,
    bn: banner ? [banner.title, banner.sub, r1(banner.t), banner.color] : 0,
    w: winner ? winner.i : -1,
    fx: NET.fx,
  };
}
function replayFx(f) {
  switch (f[1]) {
    case 'b': burst(f[2], f[3], f[4], f[5], f[6]); break;
    case 'r': addRing(f[2], f[3], f[4], f[5]); break;
    case 'f': addFloat(f[2], f[3], f[4], f[5]); break;
    case 's': beep(f[2], f[3], f[4], f[5], f[6]); break;
  }
}
function applySnap(s) {
  if (!P.length) P = [mkPlayer(0), mkPlayer(1)];
  state = s.st; roundNum = s.rn; mod = MODS.find(m => m.id === s.m) || MODS[0];
  serveTimer = s.sv; slowT = s.sl; paused = !!s.pa; shake = Math.max(shake, s.sh); flash = Math.max(flash, s.fl);
  if (NET.lastRn !== s.rn) { NET.lastRn = s.rn; P[NET.me].y = H / 2; }
  s.p.forEach((a, i) => {
    const p = P[i];
    if (i !== NET.me) { if (p.ty == null) p.y = a[0]; p.ty = a[0]; p.vy = a[14]; }
    p.h = a[1]; p.score = a[2]; p.rounds = a[3]; p.lv = a[4] || {}; p.active = a[5] || null;
    p.cd = a[6]; p.cdMax = a[7] || 1; p.frozen = a[8]; p.wallT = a[9]; p.smash = !!a[10]; p.shield = a[11];
    p.hitT = Math.max(p.hitT, a[12]); p.speed = a[13];
  });
  balls = s.b.map((a, k) => {
    const old = balls[k];
    return { x: a[0], y: a[1], vx: a[2], vy: a[3], owner: a[4], ghost: a[5], r: 8, trail: old ? old.trail : [], squash: a[6] ? 0.1 : (old ? old.squash : 0) };
  });
  obstacles = s.o.map((y, k) => ({ x: W / 2 + (k - 1) * 170 - 11, w: 22, h: 84, y }));
  if (s.ev) { const e = EVENTS.find(x => x.id === s.ev[0]) || EVENTS[0]; ev = { ...e, t: s.ev[1], dur: s.ev[2], sign: s.ev[3] }; } else ev = null;
  if (s.d) {
    if (!draft || draft.id !== s.d.id) { draft = { id: s.d.id, sel: [0, 0], done: [false, false], t: 0 }; NET.mySel = 0; }
    draft.opts = s.d.o.map(a => a.map(id => CARD[id]).filter(Boolean));
    draft.loser = s.d.l; draft.done = s.d.k.map(Boolean);
    draft.sel[1 - NET.me] = s.d.s[1 - NET.me];
    draft.sel[NET.me] = NET.mySel;
    if (NET.myPick === draft.id) draft.done[NET.me] = true;
  }
  banner = s.bn ? { title: s.bn[0], sub: s.bn[1], t: s.bn[2], color: s.bn[3] } : null;
  winner = s.w >= 0 ? P[s.w] : null;
  const fx = s.fx || [];
  if (NET.lastFx < 0) NET.lastFx = fx.length ? fx[fx.length - 1][0] : 0;
  else for (const f of fx) if (f[0] > NET.lastFx) { replayFx(f); NET.lastFx = f[0]; }
}
function guestUpdate(dt) {
  for (const r of rings) r.t += dt;
  rings = rings.filter(r => r.t < r.max);
  tickFx(dt);
  if (!P.length || state === 'title') return;
  const me = P[NET.me], inp = IN[NET.me];
  if (state === 'draft' && draft) {
    const n = (draft.opts[NET.me] || []).length, done = NET.myPick === draft.id || draft.done[NET.me];
    if (!done && n) {
      let ok = false;
      if (inp.up) { NET.mySel = (NET.mySel + n - 1) % n; beep(600, 0.03); }
      if (inp.down) { NET.mySel = (NET.mySel + 1) % n; beep(600, 0.03); }
      if (tapSel[NET.me] != null) { if (NET.mySel === tapSel[NET.me]) ok = true; else { NET.mySel = tapSel[NET.me]; beep(600, 0.03); } }
      if (inp.act) ok = true;
      if (ok) { NET.myPick = draft.id; draft.done[NET.me] = true; beep(880, 0.1, 'square', 0.05, 200); }
    }
    tapSel[NET.me] = null;
    draft.sel[NET.me] = NET.mySel;
  }
  for (const p of P) if (p !== me && p.ty != null) p.y += (p.ty - p.y) * Math.min(1, dt * 18);
  if ((state === 'serve' || state === 'play') && !paused) {
    const rawDir = movePaddle(me, inp, dt);
    if (inp.act) {
      NET.actSeq++;
      if (me.active === 'a_dash' && me.cd <= 0 && me.frozen <= 0) { me.dashT = 0.17; me.dashDir = rawDir || 1; }
    }
    if (ev) ev.t += dt;
    const k = slowT > 0 ? 0.45 : 1;
    for (const b of balls) {
      b.x += b.vx * dt * k; b.y += b.vy * dt * k;
      if (mod.id !== 'warp') { if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); } else if (b.y > H - 8) { b.y = H - 8; b.vy = -Math.abs(b.vy); } }
      b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 16) b.trail.shift();
    }
    turboFlames();
  }
  for (const p of P) p.hitT = Math.max(0, p.hitT - dt);
}
function netPoll(now) {
  if (NET.mode === 'local' || !NET.nr) return;
  let peers = [];
  try { peers = NET.nr.peers() || []; } catch (e) {}
  if (NET.mode === 'host') {
    let g = peers.find(p => !p.sameTab && p.presence && p.presence.role === 'guest' && p.presence.code === NET.code && p.peer === NET.guestPeer);
    if (!g && (!NET.guestPeer || now - NET.guestSeen > 4000)) {
      g = peers.find(p => !p.sameTab && p.presence && p.presence.role === 'guest' && p.presence.code === NET.code);
      if (g) { NET.guestPeer = g.peer; NET.rActSeen = +g.presence.a || 0; NET.rPick = -1; }
    }
    if (g) {
      NET.guestSeen = now;
      const pr = g.presence;
      if (typeof pr.y === 'number') NET.rY = clamp(pr.y, 0, H);
      if (typeof pr.a === 'number' && pr.a > NET.rActSeen) { NET.rActSeen = pr.a; NET.rActPending = true; }
      NET.rSel = pr.sel | 0; NET.rPick = typeof pr.pk === 'number' ? pr.pk : -1;
      if (state === 'title') { setStatus('¡Rival conectado!'); startMatch(); }
    }
  } else {
    const h = peers.find(p => !p.sameTab && p.presence && p.presence.role === 'host' && p.presence.code === NET.code);
    const mine = peers.find(p => p.sameTab);
    if (h) {
      NET.hostSeen = now;
      const pr = h.presence;
      if (pr.gp && mine && pr.gp !== mine.peer && (pr.gp === 'full' || state === 'title')) { leaveOnline('Esa sala ya está llena.'); return; }
      if (state === 'title') setStatus('Conectado. Esperando que empiece la partida…');
      if (pr.s && pr.s !== NET.lastSnapObj) { NET.lastSnapObj = pr.s; applySnap(pr.s); }
    } else if (!NET.hostSeen && now - NET.joinAt > 9000) { leaveOnline('No se encontró la sala ' + NET.code + '. Revisa el código.'); return; }
    if (NET.hostSeen && now - NET.hostSeen > 20000) leaveOnline('Se perdió la conexión con el anfitrión.');
  }
  if (NET.mode === 'host' && state !== 'title' && NET.guestSeen && now - NET.guestSeen > 30000) leaveOnline('Tu rival se desconectó.');
}
function netSend(now) {
  if (NET.mode === 'local' || !NET.nr || now - NET.lastSend < 33) return;
  NET.lastSend = now;
  let pr;
  if (NET.mode === 'host') {
    const snap = state === 'title' ? 0 : snapshot();
    pr = { role: 'host', code: NET.code, gp: NET.guestPeer || '', s: snap };
    if (snap) while (JSON.stringify(pr).length > 3500 && snap.fx.length) snap.fx = snap.fx.slice(1);
  } else {
    pr = { role: 'guest', code: NET.code, y: P[NET.me] ? Math.round(P[NET.me].y) : H / 2, a: NET.actSeq, sel: NET.mySel, pk: NET.myPick };
  }
  NET.nr.presence(pr).catch(() => {});
}
function netWaitMsg() {
  if (NET.mode === 'local' || state === 'title') return '';
  const now = performance.now();
  if (NET.mode === 'host' && NET.guestSeen && now - NET.guestSeen > 4000) return 'Tu rival se desconectó. Esperando a que vuelva…';
  if (NET.mode === 'guest' && NET.hostSeen && now - NET.hostSeen > 4000) return 'Se perdió la conexión con el anfitrión. Reintentando…';
  return '';
}

const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
