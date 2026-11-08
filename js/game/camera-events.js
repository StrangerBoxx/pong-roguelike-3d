/**
 * Calcula los modificadores de cámara del evento activo.
 */
'use strict';

// returns camera modifiers for the current event: yaw (rad), roll (rad), top (0..1), side (0..1)
function eventCam() {
  const r = { yaw: 0, roll: 0, top: 0, side: 0 };
  if (!ev || ev.t < 0 || !(state === 'play' || state === 'serve')) return r;
  const t = ev.t, d = ev.dur, amt = ease(t / 1.0) * ease((d - t) / 1.0);
  switch (ev.id) {
    case 'spin': r.yaw = Math.PI * 2 * ease(t / d); break;
    case 'flip': r.yaw = Math.PI * amt; break;
    case 'tilt': r.roll = ev.sign * 0.5 * amt; break;
    case 'top': r.top = amt; break;
    case 'wobble': r.yaw = Math.sin(t * 2.0) * 0.5 * amt; r.roll = Math.sin(t * 1.3) * 0.18 * amt; break;
    case 'side': r.yaw = ev.sign * (Math.PI / 2) * amt; r.side = amt; break;
  }
  return r;
}
