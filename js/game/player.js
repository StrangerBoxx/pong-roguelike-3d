/**
 * Paletas: creación, recálculo de stats por mejoras y movimiento.
 */
'use strict';

function mkPlayer(i) {
  return { i, x: i ? W - 36 : 36, y: H / 2, w: 14, h: 100, speed: 520, vy: 0, score: 0, rounds: 0,
    lv: {}, active: null, cd: 0, cdMax: 1, frozen: 0, dashT: 0, dashDir: 0, wallT: 0, smash: false,
    shield: 0, color: COLORS[i], name: PLAYER_NAMES[i], hitT: 0 };
}
function recalc() {
  for (const p of P) {
    const o = P[1 - p.i];
    let h = 100 * (1 + 0.22 * L(p, 'long')) * Math.pow(0.88, L(o, 'shrink'));
    if (mod.id === 'tiny') h *= 0.7;
    p.h = clamp(h, 40, 260);
    p.speed = 520 * (1 + 0.18 * L(p, 'fast'));
  }
}

function movePaddle(p, inp, dt) {
  let dir = inp.dir;
  if (inp.target != null) dir = clamp((inp.target - p.y) / Math.max(1, p.speed * dt), -1, 1);
  const rawDir = dir > 0.2 ? 1 : dir < -0.2 ? -1 : 0;
  let sp = p.speed;
  if (p.frozen > 0) { p.frozen -= dt; dir = 0; }
  else if (p.dashT > 0) { p.dashT -= dt; sp *= 3.2; dir = rawDir || p.dashDir; }
  p.vy = dir * sp;
  p.y = clamp(p.y + p.vy * dt, p.h / 2, H - p.h / 2);
  return rawDir;
}
function updPlayer(p, dt) {
  if (NET.mode === 'host' && p.i !== NET.me) {
    // remote player: the guest owns its paddle position
    const ny = clamp(NET.rY, p.h / 2, H - p.h / 2);
    p.vy = p.vy * 0.6 + 0.4 * clamp((ny - p.y) / Math.max(dt, 1e-3), -2000, 2000);
    p.y = ny;
    if (p.frozen > 0) p.frozen -= dt;
    if (p.dashT > 0) p.dashT -= dt;
    if (NET.rActPending) {
      NET.rActPending = false;
      if (p.active && p.cd <= 0 && p.frozen <= 0) useAbility(p, Math.sign(Math.round(p.vy / 100)));
    }
  } else {
    const inp = IN[p.i], rawDir = movePaddle(p, inp, dt);
    if (inp.act && p.active && p.cd <= 0 && p.frozen <= 0) useAbility(p, rawDir);
  }
  p.cd = Math.max(0, p.cd - dt);
  p.wallT = Math.max(0, p.wallT - dt);
  p.hitT = Math.max(0, p.hitT - dt);
}
