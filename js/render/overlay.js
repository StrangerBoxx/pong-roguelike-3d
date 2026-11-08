/**
 * Compositor del frame: dibuja la escena 3D y encima el overlay 2D.
 */
'use strict';

function render(dt) {
  if (R3) R3.render(dt);
  ctx.setTransform(K, 0, 0, K, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!R3) { text('No se pudo cargar el motor 3D (Three.js).', W / 2, H - 20, 20, '#ff8080', 'center', FB); }
  if (state === 'title') { drawTitle(dt); return; }
  drawFloats();
  if (mod.id === 'dark') {
    const gr = ctx.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.32, 'rgba(0,0,0,0.35)');
    gr.addColorStop(0.68, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  if (state !== 'draft') drawHUD();
  if (flash) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.4})`; ctx.fillRect(0, 0, W, H); }
  if (slowT > 0) { ctx.fillStyle = 'rgba(77,163,255,0.08)'; ctx.fillRect(0, 0, W, H); }
  if (state === 'draft') drawDraft();
  else if (state === 'matchEnd') drawMatchEnd();
  drawBanner();
  if (paused && (state === 'play' || state === 'serve')) {
    ctx.fillStyle = 'rgba(4,4,14,0.7)'; ctx.fillRect(0, 0, W, H);
    text('PAUSA', W / 2, H / 2 - 10, 36, '#ffffff', 'center', FT, 20);
    text(NET.mode === 'guest' ? 'El anfitrión pausó el juego' : 'P o ESC para continuar', W / 2, H / 2 + 40, 24, '#c8ccf0', 'center', FB);
  }
  const nw = netWaitMsg();
  if (nw) {
    ctx.fillStyle = 'rgba(4,4,14,0.8)'; ctx.fillRect(0, 0, W, H);
    text('CONEXIÓN', W / 2, H / 2 - 30, 26, '#ff8a5c', 'center', FT, 16);
    text(nw, W / 2, H / 2 + 20, 26, '#e8e8ff', 'center', FB);
  }
}
