/**
 * Habilidades activas (Dash, Remate, Cámara lenta, Congelar, Muralla).
 */
'use strict';

function useAbility(p, dir) {
  const o = P[1 - p.i], c = CARD[p.active];
  switch (p.active) {
    case 'a_dash': {
      let d = dir;
      if (!d) { const nb = nearestBall(p); d = nb ? Math.sign(nb.y - p.y) || 1 : 1; }
      p.dashT = 0.17; p.dashDir = d; beep(500, 0.12, 'sawtooth', 0.04, 500);
      burst(p.x, p.y, p.color, 14, 200); break;
    }
    case 'a_freeze':
      o.frozen = 0.8; beep(1400, 0.3, 'triangle', 0.06, -1000);
      burst(o.x, o.y, '#bfefff', 30, 260); addFloat(o.x + (o.i ? -60 : 60), o.y, '¡CONGELADO!', '#bfefff'); break;
    case 'a_wall':
      p.wallT = 2.5; beep(160, 0.3, 'square', 0.06, 80); break;
    case 'a_slow':
      slowT = 1.6; beep(300, 0.5, 'sine', 0.07, -200); break;
    case 'a_smash':
      p.smash = true; beep(900, 0.15, 'square', 0.04, 300); break;
  }
  p.cdMax = c.cd * Math.pow(0.75, L(p, 'cool')); p.cd = p.cdMax;
}
function nearestBall(p) {
  let best = null, bd = 1e9;
  for (const b of balls) { const d = Math.abs(b.x - p.x); if (d < bd) { bd = d; best = b; } }
  return best;
}
