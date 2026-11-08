/**
 * Utilidades matemáticas puras (sin estado).
 */
'use strict';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const L = (p, id) => p.lv[id] || 0;
const rnd = (a, b) => a + Math.random() * (b - a);

const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

function circleRect(b, cx, cy, w, h) {
  const nx = clamp(b.x, cx - w / 2, cx + w / 2), ny = clamp(b.y, cy - h / 2, cy + h / 2);
  const dx = b.x - nx, dy = b.y - ny;
  return dx * dx + dy * dy <= b.r * b.r;
}
