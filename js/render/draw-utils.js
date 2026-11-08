/**
 * Helpers de dibujo para el canvas 2D de overlay.
 */
'use strict';

const FT = '"Press Start 2P", monospace', FB = '"VT323", monospace';
function rr(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function text(s, x, y, size, color, align = 'center', font = FT, glow = 0) {
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillText(s, x, y); ctx.shadowBlur = 0;
}
function wrap(s, x, y, maxW, lh, size, color) {
  ctx.font = `${size}px ${FB}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  const words = s.split(' '); let line = '', yy = y;
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
}

function ballAlpha(b) {
  let a = 1;
  if (b.ghost) { const z = 110 + 70 * b.ghost; if (Math.abs(b.x - W / 2) < z) a = 0.06; }
  if (mod.id === 'dark') a = Math.min(a, clamp((Math.abs(b.x - W / 2) - 150) / 120, 0.03, 1));
  return a;
}
