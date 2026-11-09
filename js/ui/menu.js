/**
 * Menú HTML, teclado de código en pantalla y botones táctiles de habilidad.
 */
'use strict';

function setMsg(t) { $('mmsg').textContent = t || ''; }
function setStatus(t) { $('mstatus').textContent = t || ''; }
function setMenuMode(m) { $('mainBox').style.display = m === 'main' ? 'flex' : 'none'; $('waitBox').style.display = m === 'wait' ? 'flex' : 'none'; }
function goTitle() {
  state = 'title'; P = []; balls = []; obstacles = []; ev = null; banner = null; draft = null; winner = null; paused = false;
  floats = []; rings = []; hitStop = 0; slowT = 0; mod = MODS[0];
}

$('bLocal').addEventListener('click', () => { initAudio(); if (NET.mode !== 'local') leaveOnline(); setMsg(''); startMatch(); });
$('bHost').addEventListener('click', hostRoom);
$('bJoin').addEventListener('click', joinRoom);
$('code').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') joinRoom(); });
// on-screen code keypad (phones and tablets)
let kpVal = '';
function kpShow() { $('kpcode').textContent = (kpVal + '____').slice(0, 4); }
function kpOpen() { kpVal = ($('code').value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); kpShow(); $('kp').style.display = 'flex'; }
function kpClose() { $('kp').style.display = 'none'; }
CODE_CH.split('').forEach(ch => {
  const b = document.createElement('button'); b.textContent = ch;
  b.addEventListener('pointerdown', e => { e.preventDefault(); if (kpVal.length < 4) { kpVal += ch; kpShow(); beep(700, 0.03); } });
  $('kgrid').appendChild(b);
});
$('kDel').addEventListener('pointerdown', e => { e.preventDefault(); kpVal = kpVal.slice(0, -1); kpShow(); });
$('kClose').addEventListener('click', kpClose);
$('kOk').addEventListener('click', () => { $('code').value = kpVal; kpClose(); joinRoom(); });
$('code').addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' || isTouch) { isTouch = true; e.preventDefault(); }
});
$('code').addEventListener('click', e => {
  if (isTouch) { e.preventDefault(); $('code').blur(); kpOpen(); }
});
$('code').addEventListener('keyup', e => e.stopPropagation());
$('bCancel').addEventListener('click', () => leaveOnline(''));
$('bExit').addEventListener('click', () => { if (NET.mode !== 'local') leaveOnline(''); else goTitle(); });
$('bRot').addEventListener('click', () => $('rot').classList.add('off'));
[0, 1].forEach(i => {
  const b = $('ab' + i);
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); initAudio(); touchAct[i] = true; });
});
function updateUI() {
  $('menu').style.display = state === 'title' ? 'flex' : 'none';
  $('bExit').style.display = state !== 'title' ? 'block' : 'none';
  const cvis = chatVisible() ? 'flex' : 'none';
  if ($('chat').style.display !== cvis) $('chat').style.display = cvis;
  const playing = state === 'serve' || state === 'play';
  for (let i = 0; i < 2; i++) {
    const b = $('ab' + i), p = P[i];
    const show = isTouch && playing && p && p.active && (NET.mode === 'local' || NET.me === i);
    b.style.display = show ? 'block' : 'none';
    if (show) { const ic = CARD[p.active].icon; if (b.textContent !== ic) b.textContent = ic; b.style.opacity = p.cd <= 0 ? 1 : 0.35; }
  }
  const online = !!NET.room;
  $('code').readOnly = isTouch;
  if (state !== 'title' && $('kp').style.display !== 'none') kpClose();
  $('onote').textContent = !NET.ready ? 'Conectando el servicio online…'
    : online ? 'Online: uno crea la sala y el otro escribe el código. Solo necesitan este enlace.'
    : '⚠ No se pudo cargar el sistema online. Revisa tu conexión y recarga.';
}
