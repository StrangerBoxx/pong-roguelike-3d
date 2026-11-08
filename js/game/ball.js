/**
 * Física de la bola: velocidad, colisiones con paredes, obstáculos, paletas y goles.
 */
'use strict';

const baseSpeed = () => 400 * (mod.id === 'fast' ? 1.35 : 1);
const maxSpeed = () => 1150 * (mod.id === 'fast' ? 1.15 : 1);

function spawnBall(dir, k) {
  const s = baseSpeed();
  let a = rnd(-0.4, 0.4); if (k) a = -a + (a > 0 ? -0.3 : 0.3);
  return { x: W / 2, y: H / 2, vx: dir * s * Math.cos(a), vy: s * Math.sin(a), r: 8, owner: -1, curve: 0, ghost: 0, trail: [] };
}

function updObstacles() {
  for (const o of obstacles) o.y = H / 2 + Math.sin(T * 1.2 + o.ph) * 180 - o.h / 2;
}

function hit(p, b, px, py, ph, pw) {
  const rel = clamp((b.y - py) / (ph / 2 + b.r), -1, 1);
  let sp = Math.max(baseSpeed(), Math.hypot(b.vx, b.vy)) * (1.035 + 0.035 * L(p, 'power'));
  let ang = rel * 1.05, cap = maxSpeed();
  const dir = p.i === 0 ? 1 : -1;
  if (p.smash) {
    p.smash = false; sp *= 1.6; ang *= 0.35; cap *= 1.25; shake = 12; hitStop = 0.1; addRing(b.x, b.y, '#ffe66d', 3);
    beep(120, 0.3, 'sawtooth', 0.08, 400); burst(b.x, b.y, '#ffe66d', 36, 500);
  }
  sp = Math.min(cap, sp);
  b.vx = dir * sp * Math.cos(ang); b.vy = sp * Math.sin(ang);
  b.curve = L(p, 'spin') ? p.vy * 1.3 * L(p, 'spin') : 0;
  b.x = px + dir * (pw / 2 + b.r + 0.5);
  b.owner = p.i; b.ghost = L(p, 'ghost');
  p.hitT = 0.15;
  shake = Math.max(shake, 3);
  b.squash = 0.12;
  hitStop = Math.max(hitStop, 0.035 + 0.04 * clamp((sp - baseSpeed()) / (maxSpeed() - baseSpeed()), 0, 1));
  addRing(b.x, b.y, p.color, 1);
  beep(p.i ? 520 : 440, 0.06, 'square', 0.05);
  burst(b.x, b.y, p.color, 10, 220);
  if (L(p, 'multi') && balls.length < 6 && Math.random() < 0.2 * L(p, 'multi')) {
    const a2 = ang + (ang > 0 ? -0.65 : 0.65);
    balls.push({ ...b, vx: dir * sp * Math.cos(a2), vy: sp * Math.sin(a2), trail: [] });
    addFloat(b.x, b.y - 30, '¡MITOSIS!', '#c77dff'); beep(880, 0.1, 'triangle', 0.05, 400);
  }
}
function stepBall(b, dt) {
  if (mod.id === 'gravity') b.vy += 330 * dt;
  if (mod.id === 'wind') b.vy += Math.sin(T * 1.1) * 500 * dt;
  b.vy += b.curve * dt; b.curve *= Math.max(0, 1 - 1.4 * dt);
  const tgt = b.vx < 0 ? P[0] : P[1], m = L(tgt, 'magnet');
  if (m && Math.abs(b.x - tgt.x) < W * 0.55) b.vy += clamp(tgt.y - b.y, -260, 260) * 1.1 * m * dt;
  // keep it from going too vertical
  const minVx = baseSpeed() * 0.45;
  if (Math.abs(b.vx) < minVx) b.vx = Math.sign(b.vx || 1) * minVx;
  b.x += b.vx * dt; b.y += b.vy * dt;

  if (mod.id === 'warp') {
    if (b.y < -b.r) b.y += H + 2 * b.r; else if (b.y > H + b.r) b.y -= H + 2 * b.r;
  } else {
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); b.curve *= -0.5; wallFx(b); }
    else if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy); b.curve *= -0.5; wallFx(b); }
  }
  for (const o of obstacles) {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    if (circleRect(b, cx, cy, o.w, o.h)) {
      const ox = (o.w / 2 + b.r) - Math.abs(b.x - cx), oy = (o.h / 2 + b.r) - Math.abs(b.y - cy);
      if (ox < oy) { b.vx = Math.sign(b.x - cx) * Math.abs(b.vx); b.x += Math.sign(b.x - cx) * ox; }
      else { b.vy = Math.sign(b.y - cy) * Math.abs(b.vy); b.y += Math.sign(b.y - cy) * oy; }
      burst(b.x, b.y, '#ffe66d', 8, 160); beep(300, 0.05, 'square', 0.04); addRing(b.x, b.y, '#ffe66d', 0.6); b.squash = 0.1;
    }
  }
  for (const p of P) {
    const toward = p.i === 0 ? b.vx < 0 : b.vx > 0;
    if (!toward) continue;
    const inFront = p.i === 0 ? b.x >= p.x : b.x <= p.x;
    if (inFront && circleRect(b, p.x, p.y, p.w, p.h)) { hit(p, b, p.x, p.y, p.h, p.w); continue; }
    if (L(p, 'twin')) {
      const tx = p.i === 0 ? W * 0.3 : W * 0.7, ty = H - p.y;
      const tf = p.i === 0 ? b.x >= tx : b.x <= tx;
      if (tf && circleRect(b, tx, ty, 10, 56)) hit(p, b, tx, ty, 56, 10);
    }
  }
  for (const p of P) {
    if (p.wallT <= 0) continue;
    if (p.i === 0 && b.vx < 0 && b.x - b.r < 18) { b.x = 18 + b.r; b.vx = Math.abs(b.vx); wallFx(b, p.color); }
    if (p.i === 1 && b.vx > 0 && b.x + b.r > W - 18) { b.x = W - 18 - b.r; b.vx = -Math.abs(b.vx); wallFx(b, p.color); }
  }
  if (b.vx < 0 && b.x - b.r < 0) {
    if (P[0].shield > 0) { P[0].shield--; b.x = b.r; b.vx = Math.abs(b.vx); shieldFx(P[0], b); }
    else if (b.x < -b.r * 2) { goal(1, b); return true; }
  }
  if (b.vx > 0 && b.x + b.r > W) {
    if (P[1].shield > 0) { P[1].shield--; b.x = W - b.r; b.vx = -Math.abs(b.vx); shieldFx(P[1], b); }
    else if (b.x > W + b.r * 2) { goal(0, b); return true; }
  }
  return false;
}
function updBall(b, dt) {
  const sp = Math.hypot(b.vx, b.vy);
  const steps = Math.max(1, Math.ceil(sp * dt / 5)), h = dt / steps;
  for (let s = 0; s < steps; s++) if (stepBall(b, h)) return true;
  b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 16) b.trail.shift();
  return false;
}
