/**
 * Sintetizador de efectos de sonido con WebAudio (sin archivos de audio).
 */
'use strict';

let AC = null, muted = false;
function initAudio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
}
function beep(f, d = 0.08, type = 'square', v = 0.05, slide = 0) {
  fxRec(['s', f, d, type, v, slide]);
  if (!AC || muted) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0 + d + 0.02);
  } catch (e) {}
}
