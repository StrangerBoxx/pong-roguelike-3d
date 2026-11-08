/**
 * Efectos visuales de juego: partículas, anillos de impacto, textos flotantes.
 * Cada efecto se registra con fxRec() para replicarlo al invitado online.
 */
'use strict';

function addRing(x, y, color, size = 1) { fxRec(['r', Math.round(x), Math.round(y), color, size]); rings.push({ x, y, color, t: 0, max: 0.55 + 0.2 * size, size }); if (rings.length > 24) rings.shift(); }

function burst(x, y, color, n, spd) {
  fxRec(['b', Math.round(x), Math.round(y), color, n, Math.round(spd)]);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * spd;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, h: 0.3, vh: rnd(1, 6), life: rnd(0.4, 1.0), max: 1.0, color, size: rnd(1.5, 3.5) });
  }
  if (parts.length > 900) parts.splice(0, parts.length - 900);
}
function addFloat(x, y, text, color) { fxRec(['f', Math.round(x), Math.round(y), text, color]); floats.push({ x, y, text, color, t: 1.2 }); }

function wallFx(b, color) { burst(b.x, b.y, color || '#ffffff', 5, 120); addRing(b.x, b.y, color || '#8899ff', 0.5); b.squash = 0.1; beep(330, 0.04, 'square', 0.03); }
function shieldFx(p, b) {
  burst(b.x, b.y, p.color, 26, 300); shake = 8; addRing(b.x, b.y, p.color, 2); hitStop = 0.06; beep(700, 0.2, 'triangle', 0.06, -300);
  addFloat(p.i ? W - 110 : 110, b.y, '¡ESCUDO!', p.color);
}

function turboFlames() {
  for (const p of P) {
    const f = L(p, 'fast');
    if (f && Math.abs(p.vy) > 30 && Math.random() < 0.35 + 0.15 * f) {
      parts.push({ x: p.x + rnd(-4, 4), y: p.y - Math.sign(p.vy) * p.h / 2, vx: rnd(-40, 40), vy: -Math.sign(p.vy) * rnd(80, 220),
        h: rnd(0.2, 0.6), vh: rnd(0, 2), life: rnd(0.2, 0.4), max: 0.4, color: Math.random() < 0.5 ? '#ff9a3c' : '#ffe66d', size: 2 });
    }
  }
}

function tickFx(dt) {
  for (const q of parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; q.life -= dt; q.vh -= 14 * dt; q.h += q.vh * dt; if (q.h < 0.02) { q.h = 0.02; q.vh = Math.abs(q.vh) * 0.4; } }
  parts = parts.filter(q => q.life > 0);
  for (const f of floats) { f.t -= dt; f.y -= 30 * dt; }
  floats = floats.filter(f => f.t > 0);
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  shake *= Math.pow(0.0005, dt); if (shake < 0.3) shake = 0;
  flash = Math.max(0, flash - dt);
}
