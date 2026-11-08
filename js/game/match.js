/**
 * Flujo de la partida: draft de cartas, rondas, goles y máquina de estados principal.
 */
'use strict';

function startMatch() {
  P = [mkPlayer(0), mkPlayer(1)];
  roundNum = 0; mod = MODS[0]; winner = null; balls = []; obstacles = []; parts = []; floats = [];
  serveDir = Math.random() < 0.5 ? -1 : 1;
  beginDraft(-1);
  beep(440, 0.1); setTimeout(() => beep(660, 0.12), 90);
}
function rollOptions(p, guarantee) {
  const pool = CARDS.filter(c => c.active ? p.active !== c.id : (L(p, c.id) < c.max && (c.id !== 'cool' || p.active)));
  const opts = [];
  for (let n = 0; n < 3; n++) {
    let cand = pool.filter(c => !opts.includes(c) && (!(guarantee && n === 0) || c.rar >= 1));
    if (!cand.length) cand = pool.filter(c => !opts.includes(c));
    if (!cand.length) break;
    const ws = cand.map(c => RAR[c.rar].w);
    let r = Math.random() * ws.reduce((a, b) => a + b, 0), k = 0;
    while (k < ws.length - 1 && r > ws[k]) { r -= ws[k]; k++; }
    opts.push(cand[k]);
  }
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return opts;
}
function beginDraft(loser) {
  NET.draftId++;
  draft = { opts: [rollOptions(P[0], loser === 0), rollOptions(P[1], loser === 1)], sel: [0, 0], done: [false, false], loser, t: 0 };
  state = 'draft';
}
function applyCard(p, c) {
  if (c.active) { p.active = c.id; p.cd = 0; }
  else p.lv[c.id] = L(p, c.id) + 1;
}
function startRound() {
  roundNum++;
  if (roundNum === 1) mod = MODS[0];
  else { const c = MODS.filter(m => m.id !== mod.id); mod = c[Math.random() * c.length | 0]; }
  for (const p of P) {
    p.score = 0; p.y = H / 2; p.shield = L(p, 'shield'); p.cd = 0; p.frozen = 0;
    p.wallT = 0; p.smash = false; p.dashT = 0;
  }
  recalc();
  balls = []; slowT = 0; ev = null; nextEv = rnd(8, 14); rings = [];
  obstacles = mod.id === 'blocks' ? [0, 1, 2].map(k => ({ x: W / 2 + (k - 1) * 170 - 11, w: 22, h: 84, ph: k * 2.1, y: 0 })) : [];
  updObstacles();
  state = 'serve'; serveTimer = 2.4;
  banner = { title: 'RONDA ' + roundNum, sub: mod.name.toUpperCase() + ' · ' + mod.desc, t: 2.4, color: '#ffe66d' };
}

function goal(si, b) {
  const s = P[si], o = P[1 - si];
  let pts = 1;
  if (Math.random() < 0.25 * L(s, 'crit')) { pts = 2; addFloat(b.x < W / 2 ? 120 : W - 120, b.y, '¡CRÍTICO x2!', '#ffe66d'); }
  s.score += pts;
  burst(clamp(b.x, 0, W), b.y, s.color, 40, 420); addRing(clamp(b.x, 0, W), b.y, s.color, 2.6); hitStop = 0.12;
  shake = 16; flash = 0.25;
  beep(220, 0.25, 'sawtooth', 0.06, -120);
  serveDir = si === 0 ? 1 : -1;
  if (s.score >= POINTS) endRound(s, o);
}
function endRound(w, l) {
  ev = null;
  balls = []; w.rounds++; lastLoser = l.i;
  state = 'roundEnd'; endT = 2.3;
  serveDir = l.i === 0 ? -1 : 1;
  if (w.rounds >= ROUNDS) winner = w;
  banner = { title: w.name, sub: winner ? '¡GANA LA PARTIDA!' : 'GANA LA RONDA ' + roundNum, t: 2.3, color: w.color };
  beep(523, 0.12, 'square', 0.05); setTimeout(() => beep(659, 0.12), 120); setTimeout(() => beep(784, 0.25), 240);
  for (let k = 0; k < 4; k++) burst(rnd(200, W - 200), rnd(150, H - 150), w.color, 30, 300);
}

function updDraft(dt) {
  for (let i = 0; i < 2; i++) {
    if (draft.done[i]) { tapSel[i] = null; continue; }
    const n = draft.opts[i].length;
    let ok = false;
    if (NET.mode === 'host' && i !== NET.me) {
      draft.sel[i] = clamp(NET.rSel | 0, 0, Math.max(0, n - 1));
      ok = NET.rPick === NET.draftId;
    } else {
      const inp = IN[i];
      if (n && inp.up) { draft.sel[i] = (draft.sel[i] + n - 1) % n; beep(600, 0.03); }
      if (n && inp.down) { draft.sel[i] = (draft.sel[i] + 1) % n; beep(600, 0.03); }
      if (tapSel[i] != null) { if (draft.sel[i] === tapSel[i]) ok = true; else { draft.sel[i] = tapSel[i]; beep(600, 0.03); } tapSel[i] = null; }
      if (inp.act || (NET.mode === 'local' && i === 0 && pressed.has('Space'))) ok = true;
    }
    if (ok) {
      if (n) applyCard(P[i], draft.opts[i][draft.sel[i]]);
      draft.done[i] = true; beep(880, 0.1, 'square', 0.05, 200);
    }
  }
  if (draft.done[0] && draft.done[1]) { draft.t += dt; if (draft.t > 0.6) { recalc(); startRound(); } }
}

function update(dt) {
  if (pressed.has('KeyM')) muted = !muted;
  for (const r of rings) r.t += dt;
  rings = rings.filter(r => r.t < r.max);
  if (hitStop > 0 && (state === 'play' || state === 'serve') && !paused) {
    hitStop -= dt;
    return;
  }
  const startKey = pressed.has('Space') || pressed.has('Enter');
  switch (state) {
    case 'title': if (startKey && NET.mode === 'local') startMatch(); break;
    case 'draft': updDraft(dt); break;
    case 'serve': case 'play': {
      if (pressed.has('KeyP') || pressed.has('Escape')) paused = !paused;
      if (paused) break;
      for (const p of P) updPlayer(p, dt);
      // map-rotation events
      if (ev) { ev.t += dt; if (ev.t >= ev.dur) { ev = null; nextEv = rnd(12, 20); } }
      else if (state === 'play') {
        nextEv -= dt;
        if (nextEv <= 0) {
          const e = EVENTS[Math.random() * EVENTS.length | 0];
          ev = { ...e, t: -1.3, sign: Math.random() < 0.5 ? -1 : 1 };
          beep(200, 0.15, 'square', 0.05, 300); setTimeout(() => beep(400, 0.2, 'square', 0.05, 400), 160);
        }
      }
      turboFlames();
      updObstacles();
      slowT = Math.max(0, slowT - dt);
      if (state === 'serve') {
        serveTimer -= dt;
        if (serveTimer <= 0) {
          const n = mod.id === 'multi' ? 2 : 1;
          for (let k = 0; k < n; k++) balls.push(spawnBall(serveDir, k));
          state = 'play'; beep(990, 0.08);
        }
      } else {
        const bdt = dt * (slowT > 0 ? 0.45 : 1);
        for (let i = balls.length - 1; i >= 0; i--) {
          if (updBall(balls[i], bdt)) balls.splice(i, 1);
          if (state !== 'play') break;
        }
        if (state === 'play' && balls.length === 0) { state = 'serve'; serveTimer = 1.1; }
      }
      break;
    }
    case 'roundEnd':
      endT -= dt;
      if (endT <= 0) { if (winner) state = 'matchEnd'; else beginDraft(lastLoser); }
      break;
    case 'matchEnd': if (startKey) startMatch(); break;
  }
  tickFx(dt);
}
