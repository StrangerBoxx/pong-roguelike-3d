/**
 * Pantallas 2D: draft de cartas, título y fin de partida.
 */
'use strict';

function drawCard(x, y, w, h, c, p, sel) {
  const rc = RAR[c.rar];
  ctx.fillStyle = sel ? 'rgba(30,30,70,0.95)' : 'rgba(16,16,42,0.9)';
  rr(x, y, w, h, 10); ctx.fill();
  if (sel) { ctx.shadowColor = p.color; ctx.shadowBlur = 24; ctx.strokeStyle = p.color; ctx.lineWidth = 4; }
  else { ctx.strokeStyle = rc.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; }
  ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.fillStyle = rc.color; rr(x, y, 6, h, 3); ctx.fill();
  ctx.font = `38px ${FB}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.fillText(c.icon, x + 42, y + h / 2);
  text(c.name, x + 78, y + 26, 13, '#ffffff', 'left');
  text(rc.name, x + w - 14, y + 26, 18, rc.color, 'right', FB);
  const lvTxt = c.active ? (p.active ? 'reemplaza ' + CARD[p.active].name : 'habilidad activa') : `nivel ${L(p, c.id)} → ${L(p, c.id) + 1}`;
  text(lvTxt, x + 78, y + 48, 18, c.active ? '#ffe66d' : '#8f96c8', 'left', FB);
  wrap(c.desc, x + 78, y + 72, w - 96, 20, 21, '#d8dcff');
}
function drawDraft() {
  ctx.fillStyle = 'rgba(4,4,14,0.86)'; ctx.fillRect(0, 0, W, H);
  text('ELIGE UNA MEJORA', W / 2, 36, 20, '#ffe66d', 'center', FT, 14);
  const sub = draft.loser < 0 ? 'Mejora inicial · gana ' + ROUNDS + ' rondas de ' + POINTS + ' puntos'
    : `Ronda ${roundNum} terminada · ${P[draft.loser].name} recibe una carta rara garantizada`;
  text(sub, W / 2, 66, 22, '#c8ccf0', 'center', FB);
  for (let i = 0; i < 2; i++) {
    const p = P[i], cx = i ? W * 0.75 : W * 0.25, cw = 420, x0 = cx - cw / 2;
    const mine = NET.mode === 'local' || i === NET.me;
    text(p.name + (NET.mode !== 'local' && i === NET.me ? ' (TÚ)' : ''), cx, 100, 14, p.color, 'center', FT, 12);
    const hint = !mine ? 'tu rival está eligiendo…'
      : isTouch ? 'toca una carta · tócala otra vez para elegirla'
      : NET.mode !== 'local' ? 'W/S o ↑/↓ mover · D, ← o ENTER elegir'
      : i ? '↑/↓ mover · ← o ENTER elegir' : 'W/S mover · D elegir';
    text(hint, cx, 122, 20, '#8f96c8', 'center', FB);
    draftRects[i] = draft.opts[i].map((c, k) => ({ x: x0, y: 140 + k * 128, w: cw, h: 116 }));
    draft.opts[i].forEach((c, k) => drawCard(x0, 140 + k * 128, cw, 116, c, p, !draft.done[i] && draft.sel[i] === k));
    if (draft.done[i]) {
      ctx.fillStyle = 'rgba(4,4,14,0.6)'; rr(x0, 140, cw, 372, 10); ctx.fill();
      text('¡LISTO!', cx, 326, 24, p.color, 'center', FT, 20);
    }
    const build = Object.entries(p.lv).map(([id, lv]) => CARD[id].icon + lv).join('  ') + (p.active ? '   ' + CARD[p.active].icon + ' ' + CARD[p.active].name : '');
    text(build || 'sin mejoras todavía', cx, 540, 22, '#d8dcff', 'center', FB);
    if (draft.loser >= 0) text(`${p.rounds} ronda${p.rounds === 1 ? '' : 's'} ganada${p.rounds === 1 ? '' : 's'}`, cx, 568, 20, '#8f96c8', 'center', FB);
  }
}

function drawTitle(dt) {
  const tg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 600);
  tg.addColorStop(0, 'rgba(4,4,14,0.62)'); tg.addColorStop(1, 'rgba(4,4,14,0.15)');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);
  text('PONG', W / 2, 78, 64, '#ffffff', 'center', FT, 30);
  text('ROGUELIKE 3D', W / 2, 140, 24, '#ffe66d', 'center', FT, 18);
  text('Gana ' + POINTS + ' puntos por ronda · ' + ROUNDS + ' rondas para ganar · mejoras entre rondas', W / 2, 186, 21, '#c8ccf0', 'center', FB);
  text('Teclado: J1 W/S + D · J2 ↑/↓ + ← · Táctil: arrastra para mover, botón redondo = habilidad', W / 2, 584, 18, '#8f96c8', 'center', FB);
}
function drawMatchEnd() {
  ctx.fillStyle = 'rgba(4,4,14,0.85)'; ctx.fillRect(0, 0, W, H);
  text('¡' + winner.name + ' GANA!', W / 2, 120, 32, winner.color, 'center', FT, 26);
  text(`${P[0].rounds} — ${P[1].rounds}`, W / 2, 180, 26, '#ffffff', 'center', FT);
  for (const p of P) {
    const cx = p.i ? W * 0.75 : W * 0.25;
    text(p.name, cx, 250, 13, p.color, 'center', FT, 10);
    const items = Object.entries(p.lv).map(([id, lv]) => `${CARD[id].icon} ${CARD[id].name} ${lv}`);
    if (p.active) items.push(`${CARD[p.active].icon} ${CARD[p.active].name} (habilidad)`);
    items.forEach((s, k) => text(s, cx, 285 + k * 26, 22, '#d8dcff', 'center', FB));
  }
  const again = NET.mode === 'guest' ? 'ESPERANDO QUE EL ANFITRIÓN PIDA LA REVANCHA' : isTouch ? 'TOCA LA PANTALLA PARA LA REVANCHA' : 'ESPACIO O CLIC PARA LA REVANCHA';
  if (Math.sin(T * 4) > -0.3) text(again, W / 2, 555, 14, '#ffffff', 'center', FT, 12);
}
