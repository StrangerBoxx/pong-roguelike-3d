/**
 * Entrada: teclado, táctil/puntero y mapeo de controles por jugador.
 */
'use strict';

const keys = new Set(), pressed = new Set();
addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code)) e.preventDefault();
  if (!e.repeat) pressed.add(e.code);
  keys.add(e.code); initAudio();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
let isTouch = false;
try { isTouch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
const drags = new Map(), touchTarget = [null, null], touchAct = [false, false], tapSel = [null, null];
let draftRects = [[], []];
function toGame(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
cv.addEventListener('pointerdown', e => {
  cv.focus(); initAudio();
  if (e.pointerType === 'touch') isTouch = true;
  const g = toGame(e);
  if (state === 'title') return;
  if (state === 'matchEnd') { if (NET.mode !== 'guest') pressed.add('Space'); return; }
  if (state === 'draft') {
    const pids = NET.mode === 'local' ? [0, 1] : [NET.me];
    for (const i of pids) (draftRects[i] || []).forEach((r, k) => {
      if (g.x >= r.x && g.x <= r.x + r.w && g.y >= r.y && g.y <= r.y + r.h) tapSel[i] = k;
    });
    return;
  }
  const pid = NET.mode === 'local' ? (g.x < W / 2 ? 0 : 1) : NET.me;
  if (!P[pid]) return;
  drags.set(e.pointerId, { pid, sy: g.y, py: P[pid].y });
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
});
cv.addEventListener('pointermove', e => {
  const d = drags.get(e.pointerId); if (!d) return;
  const g = toGame(e);
  touchTarget[d.pid] = clamp(d.py + (g.y - d.sy) * 1.6, 0, H);
});
function endDrag(e) {
  const d = drags.get(e.pointerId); if (!d) return;
  drags.delete(e.pointerId);
  if (![...drags.values()].some(o => o.pid === d.pid)) touchTarget[d.pid] = null;
}
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
const IN = [0, 1].map(() => ({ dir: 0, target: null, act: false, up: false, down: false }));
const CTRL = [
  { up: ['KeyW'], down: ['KeyS'], act: ['KeyD'], keyName: 'D' },
  { up: ['ArrowUp'], down: ['ArrowDown'], act: ['ArrowLeft', 'Enter'], keyName: '←' },
];
const any = (set, list) => list.some(k => set.has(k));
function gatherInput() {
  for (const o of IN) { o.dir = 0; o.target = null; o.act = false; o.up = false; o.down = false; }
  const ctl = (i, c) => {
    const o = IN[i];
    o.dir += (any(keys, c.down) ? 1 : 0) - (any(keys, c.up) ? 1 : 0);
    if (any(pressed, c.act)) o.act = true;
    if (any(pressed, c.up)) o.up = true;
    if (any(pressed, c.down)) o.down = true;
  };
  if (NET.mode === 'local') { ctl(0, CTRL[0]); ctl(1, CTRL[1]); }
  else { ctl(NET.me, CTRL[0]); ctl(NET.me, CTRL[1]); if (pressed.has('Space')) IN[NET.me].act = true; }
  for (let i = 0; i < 2; i++) {
    IN[i].dir = clamp(IN[i].dir, -1, 1);
    if (touchTarget[i] != null && !IN[i].dir) IN[i].target = touchTarget[i];
    if (touchAct[i]) { IN[i].act = true; touchAct[i] = false; }
  }
}
