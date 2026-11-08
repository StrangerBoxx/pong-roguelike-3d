/**
 * HUD en partida: marcador, rondas, mejoras, habilidad, banners y textos flotantes.
 */
'use strict';

function drawHUD() {
  for (const p of P) {
    const cx = p.i ? W / 2 + 90 : W / 2 - 90;
    text(String(p.score), cx, 58, 42, p.color, 'center', FT, 18);
    for (let k = 0; k < ROUNDS; k++) {
      const x = cx + (k - (ROUNDS - 1) / 2) * 20;
      ctx.beginPath(); ctx.arc(x, 98, 6, 0, Math.PI * 2);
      if (k < p.rounds) { ctx.fillStyle = p.color; ctx.fill(); }
      else { ctx.strokeStyle = p.color; ctx.globalAlpha = 0.4; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; }
    }
    if (NET.mode !== 'local' && p.i === NET.me) text('TÚ', cx, 122, 10, p.color, 'center', FT, 8);
    // build chips
    const ents = Object.entries(p.lv);
    ctx.font = `20px ${FB}`; ctx.textBaseline = 'middle';
    let x = p.i ? W - 16 : 16;
    for (const [id, lv] of ents) {
      const s = CARD[id].icon + lv, w = ctx.measureText(s).width + 10;
      ctx.textAlign = p.i ? 'right' : 'left'; ctx.fillStyle = '#d8dcff'; ctx.globalAlpha = 0.85;
      ctx.fillText(s, x, H - 16); ctx.globalAlpha = 1;
      x += p.i ? -w : w;
    }
    if (p.active) {
      const c = CARD[p.active], bw = 150, bx = p.i ? W - 16 - bw : 16, by = H - 50;
      const ready = p.cd <= 0;
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; rr(bx, by - 13, bw, 26, 6); ctx.fill();
      ctx.fillStyle = ready ? p.color : 'rgba(255,255,255,0.25)';
      rr(bx, by - 13, bw * (ready ? 1 : 1 - p.cd / p.cdMax), 26, 6); ctx.globalAlpha = ready ? 0.35 : 1; ctx.fill(); ctx.globalAlpha = 1;
      text(`[${isTouch ? '●' : NET.mode !== 'local' ? 'D' : CTRL[p.i].keyName}] ${c.icon} ${c.name}`, bx + bw / 2, by + 1, 20, ready ? '#fff' : '#9aa0c0', 'center', FB);
    }
  }
  text('RONDA ' + roundNum, W / 2, 22, 10, '#ffe66d');
  text(mod.name.toUpperCase(), W / 2, 40, 18, '#ffe66d', 'center', FB);
  if (ev) {
    const warn = ev.t < 0;
    if (!warn || Math.sin(T * 18) > 0) {
      ctx.fillStyle = 'rgba(10,10,30,0.7)'; rr(W / 2 - 150, 120, 300, 34, 8); ctx.fill();
      text((warn ? '⚠ EVENTO: ' : ev.icon + ' ') + ev.name + (warn ? '' : '  ' + Math.ceil(ev.dur - ev.t) + 's'), W / 2, 138, 22, warn ? '#ff8a5c' : '#ffe66d', 'center', FB);
    }
  }
  if (slowT > 0) text('CÁMARA LENTA', W / 2, H - 60, 12, '#4da3ff', 'center', FT, 10);
  if (state === 'serve' && !banner && serveTimer > 0) text(String(Math.ceil(serveTimer)), W / 2, H / 2, 40, '#ffffff', 'center', FT, 16);
}
function drawBanner() {
  if (!banner) return;
  const a = clamp(banner.t * 2, 0, 1);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(5,5,20,0.75)'; ctx.fillRect(0, H / 2 - 70, W, 140);
  text(banner.title, W / 2, H / 2 - 18, 34, banner.color, 'center', FT, 22);
  text(banner.sub, W / 2, H / 2 + 34, 26, '#e8e8ff', 'center', FB);
  ctx.globalAlpha = 1;
}
function drawFloats() {
  for (const f of floats) {
    const q = R3 ? R3.project(f.x, f.y, 1.2) : { x: f.x, y: f.y };
    ctx.globalAlpha = clamp(f.t, 0, 1); text(f.text, q.x, q.y, 12, f.color, 'center', FT, 10);
  }
  ctx.globalAlpha = 1;
}
