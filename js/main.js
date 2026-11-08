/**
 * Punto de entrada: escalado de pantalla, bucle principal y arranque.
 */
'use strict';

function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H) * 0.98;
  const d = window.devicePixelRatio || 1;
  cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px';
  const wr = document.getElementById('wrap'); wr.style.width = W * s + 'px'; wr.style.height = H * s + 'px';
  document.getElementById('ui').style.setProperty('--u', s);
  if (R3) R3.resize(W * s, H * s);
  cv.width = Math.round(W * s * d); cv.height = Math.round(H * s * d);
  K = cv.width / W;
}
addEventListener('resize', resize);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now; T += dt;
  netPoll(now);
  gatherInput();
  if (NET.mode === 'guest') guestUpdate(dt);
  else if (netWaitMsg()) tickFx(dt);
  else update(dt);
  netSend(now);
  render(dt); pressed.clear();
  updateUI();
  requestAnimationFrame(frame);
}
R3 = make3D();
resize();
requestAnimationFrame(frame);
cv.focus();
