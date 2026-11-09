/**
 * Chat de voz online (WebRTC vía PeerJS).
 * - Micrófono apagado por defecto. Clic en 🎤 = encender/apagar. Mantener V = hablar mientras se presiona.
 * - Cada lado envía su audio con una llamada de un solo sentido; silenciar = desactivar la pista (sin renegociar).
 * - 🔊 silencia la voz del rival y brilla en su color cuando habla.
 */
'use strict';

const voice = {
  stream: null, acquiring: false,   // micrófono local
  toggled: false, ptt: false,       // modos de transmisión
  out: null, lastTry: 0,            // llamada saliente (mi voz)
  inCall: null, el: null,           // llamada entrante (voz del rival)
  localAn: null, remoteAn: null, buf: null,
  rivalMuted: false, needsUnlock: false,
};

const voiceLive = () => voice.toggled || voice.ptt;

function voiceApply() {
  if (voice.stream) for (const t of voice.stream.getAudioTracks()) t.enabled = voiceLive();
}
function voiceAnalyser(stream) {
  initAudio();
  if (!AC) return null;
  try {
    const an = AC.createAnalyser(); an.fftSize = 512;
    AC.createMediaStreamSource(stream).connect(an);   // medición solamente, no se conecta a la salida
    return an;
  } catch (e) { return null; }
}
function voiceLevel(an) {
  if (!an) return 0;
  if (!voice.buf || voice.buf.length !== an.fftSize) voice.buf = new Uint8Array(an.fftSize);
  an.getByteTimeDomainData(voice.buf);
  let s = 0;
  for (let i = 0; i < voice.buf.length; i++) { const v = (voice.buf[i] - 128) / 128; s += v * v; }
  return Math.sqrt(s / voice.buf.length);
}

async function voiceEnsureMic() {
  if (voice.stream) return true;
  if (voice.acquiring) return false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    chatSystem('Tu navegador no permite usar el micrófono en esta página.'); return false;
  }
  voice.acquiring = true;
  try {
    voice.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (e) {
    voice.acquiring = false; voice.toggled = false; voice.ptt = false;
    chatSystem(e && e.name === 'NotAllowedError'
      ? 'Permiso de micrófono denegado. Actívalo en el candado de la barra de direcciones.'
      : 'No se encontró un micrófono.');
    return false;
  }
  voice.acquiring = false;
  if (!NET.nr) { voiceStopMic(); return false; }   // salió de la sala mientras pedía permiso
  voiceApply();
  voice.localAn = voiceAnalyser(voice.stream);
  return true;
}
function voiceCall() {
  if (voice.out || !voice.stream || !NET.nr) return;
  const now = performance.now();
  if (now - voice.lastTry < 2000) return;
  voice.lastTry = now;
  const mc = NET.nr.call(voice.stream);
  if (!mc) return;
  voice.out = mc;
  const drop = () => { if (voice.out === mc) voice.out = null; };
  mc.on('close', drop); mc.on('error', drop);
}

function voiceIncoming(mc) {
  if (voice.inCall) { try { voice.inCall.close(); } catch (e) {} }
  voice.inCall = mc;
  mc.answer();                                       // solo recibir
  mc.on('stream', s => voicePlay(s));
  const drop = () => { if (voice.inCall === mc) { voice.inCall = null; voiceStopRemote(); } };
  mc.on('close', drop); mc.on('error', drop);
}
function voicePlay(stream) {
  if (!voice.el) {
    voice.el = document.createElement('audio');
    voice.el.autoplay = true; voice.el.setAttribute('playsinline', '');
    document.body.appendChild(voice.el);
  }
  voice.el.srcObject = stream;
  voice.el.muted = voice.rivalMuted;
  voice.el.play().catch(() => { voice.needsUnlock = true; });   // iOS: espera a un toque
  voice.remoteAn = voiceAnalyser(stream);
}
function voiceStopRemote() {
  if (voice.el) { voice.el.srcObject = null; }
  voice.remoteAn = null;
}
function voiceStopMic() {
  if (voice.stream) for (const t of voice.stream.getTracks()) t.stop();
  voice.stream = null; voice.localAn = null;
}
function voiceReset() {
  for (const k of ['out', 'inCall']) { if (voice[k]) { try { voice[k].close(); } catch (e) {} voice[k] = null; } }
  voiceStopMic(); voiceStopRemote();
  voice.toggled = voice.ptt = false; voice.lastTry = 0;
}
function voiceBind(nr) { nr.onCall = voiceIncoming; }

async function voiceSet(mode, on) {
  voice[mode] = on;
  if (on && !(await voiceEnsureMic())) return;
  voiceApply();
  if (voiceLive()) voiceCall();
}

// llamado cada frame desde updateUI
function voiceUpdate() {
  if (!chatVisible()) return;
  if (voiceLive() && voice.stream && !voice.out) voiceCall();       // reintento si la conexión no estaba lista
  const mic = $('micBtn'), spk = $('spkBtn');
  const live = voiceLive() && !!voice.stream;
  const ml = live ? Math.min(1, voiceLevel(voice.localAn) * 8) : 0;
  mic.classList.toggle('live', live);
  mic.style.setProperty('--lv', ml.toFixed(2));
  const rl = voice.remoteAn && !voice.rivalMuted ? Math.min(1, voiceLevel(voice.remoteAn) * 8) : 0;
  const rival = 1 - NET.me;
  spk.classList.toggle('talk', rl > 0.12);
  spk.style.setProperty('--rc', COLORS[rival]);
  const ic = voice.rivalMuted ? '🔇' : '🔊';
  if (spk.textContent !== ic) spk.textContent = ic;
}

$('micBtn').addEventListener('click', () => { initAudio(); voiceSet('toggled', !voice.toggled); });
$('spkBtn').addEventListener('click', () => {
  voice.rivalMuted = !voice.rivalMuted;
  if (voice.el) voice.el.muted = voice.rivalMuted;
});
addEventListener('keydown', e => {
  if (e.code === 'KeyV' && !e.repeat && chatVisible()) { e.preventDefault(); voiceSet('ptt', true); }
});
addEventListener('keyup', e => { if (e.code === 'KeyV' && voice.ptt) voiceSet('ptt', false); });
addEventListener('blur', () => { if (voice.ptt) voiceSet('ptt', false); });
// desbloqueo de reproducción en móviles
const voiceUnlock = () => { if (voice.needsUnlock && voice.el) voice.el.play().then(() => { voice.needsUnlock = false; }).catch(() => {}); };
addEventListener('pointerdown', voiceUnlock, true);
addEventListener('keydown', voiceUnlock, true);
