/**
 * Chat online: panel lateral izquierdo plegable con contador de mensajes sin leer.
 * Solo visible en partidas online. Tecla T abre, Esc cierra, Enter envía.
 */
'use strict';

const CHAT_MAX = 140, CHAT_KEEP = 60;
const chat = { open: false, unread: 0 };

function chatVisible() { return NET.mode !== 'local' && !!NET.nr && state !== 'title'; }

function chatBadge() {
  const b = $('chatBadge');
  b.textContent = '+' + (chat.unread > 99 ? 99 : chat.unread);
  b.style.display = chat.unread ? 'block' : 'none';
}
function chatLine(nodes, cls) {
  const log = $('chatLog'), row = document.createElement('div');
  row.className = 'cmsg' + (cls ? ' ' + cls : '');
  row.append(...nodes);
  log.appendChild(row);
  while (log.children.length > CHAT_KEEP) log.firstChild.remove();
  log.scrollTop = log.scrollHeight;
}
// from: player index (0 azul, 1 rosa). Text is inserted as text node, never as HTML.
function chatAdd(from, text) {
  const who = document.createElement('b');
  who.textContent = PLAYER_NAMES[from] + (from === NET.me ? ' (tú)' : '') + ': ';
  who.style.color = COLORS[from];
  chatLine([who, document.createTextNode(text)]);
  if (from !== NET.me) {
    if (!chat.open) { chat.unread++; chatBadge(); }
    beep(1200, 0.05, 'sine', 0.04); beep(1600, 0.06, 'sine', 0.03);
  }
}
function chatSystem(text) { chatLine([document.createTextNode(text)], 'sys'); }

function chatSetOpen(v) {
  chat.open = v;
  $('chat').classList.toggle('open', v);
  if (v) {
    chat.unread = 0; chatBadge(); keys.clear();
    if (!isTouch) setTimeout(() => $('chatIn').focus(), 0);
  } else { $('chatIn').blur(); cv.focus(); }
}
function chatSend() {
  const inp = $('chatIn'), t = inp.value.replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
  if (!t) return;
  if (NET.nr && NET.nr.say(t)) { chatAdd(NET.me, t); inp.value = ''; }
  else chatSystem('No se pudo enviar: sin conexión con tu rival.');
}
function chatReset() {
  $('chatLog').textContent = ''; $('chatIn').value = '';
  chat.unread = 0; chatBadge(); chat.open = false; $('chat').classList.remove('open');
}
// called by the lobby once the room exists
function chatBind(nr) { nr.onChat = text => chatAdd(1 - NET.me, text); }

$('chatTab').addEventListener('click', () => { initAudio(); chatSetOpen(!chat.open); });
$('chatSend').addEventListener('click', () => { chatSend(); if (!isTouch) $('chatIn').focus(); });
$('chatIn').addEventListener('keydown', e => {
  e.stopPropagation();                       // don't move paddles while typing
  if (e.key === 'Enter') { e.preventDefault(); chatSend(); }
  else if (e.key === 'Escape') { e.preventDefault(); chatSetOpen(false); }
});
addEventListener('keydown', e => {
  if (e.code === 'KeyT' && !e.repeat && chatVisible() && !chat.open) { e.preventDefault(); chatSetOpen(true); }
});
