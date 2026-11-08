/**
 * Lobby online: crear sala, unirse por código y salir.
 */
'use strict';

const NO_ONLINE = 'No se pudo cargar el sistema online. Revisa tu conexión a internet y recarga la página.';
async function hostRoom() {
  if (!NET.ready) { setMsg('Conectando el servicio online… intenta en unos segundos.'); return; }
  if (!NET.room) { setMsg(NO_ONLINE); return; }
  initAudio(); setMsg('');
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_CH[Math.random() * CODE_CH.length | 0];
  try { NET.nr = await NET.room.join(code.toLowerCase(), 'host'); }
  catch (e) { setMsg('No se pudo crear la sala (' + ((e && e.code) || 'error') + ').'); return; }
  Object.assign(NET, { mode: 'host', me: 0, code, guestPeer: '', guestSeen: 0, rActSeen: 0, rActPending: false, rPick: -1, rSel: 0, fx: [], fxSeq: 0, lastSend: 0 });
  $('bigcode').textContent = code;
  setStatus('Pásale este código a tu rival. Esperando que se una…');
  setMenuMode('wait');
}
async function joinRoom() {
  if (!NET.ready) { setMsg('Conectando el servicio online… intenta en unos segundos.'); return; }
  if (!NET.room) { setMsg(NO_ONLINE); return; }
  initAudio(); setMsg('');
  const code = ($('code').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { if (isTouch) kpOpen(); else setMsg('Escribe el código de 4 caracteres.'); return; }
  try { NET.nr = await NET.room.join(code.toLowerCase(), 'guest'); }
  catch (e) { setMsg('No se pudo entrar a la sala (' + ((e && e.code) || 'error') + ').'); return; }
  goTitle();
  Object.assign(NET, { mode: 'guest', me: 1, code, hostSeen: 0, joinAt: performance.now(), lastFx: -1, lastSnapObj: null, actSeq: 0, mySel: 0, myPick: -1, lastRn: -1, lastSend: 0 });
  $('bigcode').textContent = code;
  setStatus('Buscando la sala…');
  setMenuMode('wait');
}
function leaveOnline(msg) {
  const nr = NET.nr; NET.nr = null;
  if (nr) nr.leave().catch(() => {});
  NET.mode = 'local'; NET.me = 0;
  goTitle(); setMenuMode('main'); setMsg(msg || '');
}
