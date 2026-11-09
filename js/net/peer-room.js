/**
 * Transporte online sobre PeerJS (WebRTC). El navegador del anfitrión actúa de servidor.
 * Interfaz: join(code, role) -> { presence, peers, leave, say, onChat, call, onCall }.
 */
'use strict';

function makePeerRoom() {
  if (!window.Peer) return null;
  const PREFIX = 'pong-roguelike-3d-v1-';
  const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
  const opts = Object.assign({ config: ICE, debug: 0 }, window.PEER_OPTS || {});
  return {
    join(name, role) {
      return new Promise((resolve, reject) => {
        let mine = {}, remote = null, remoteId = '', conn = null, settled = false, myId = '';
        const peer = role === 'host' ? new Peer(PREFIX + name, opts) : new Peer(opts);
        const send = () => { if (conn && conn.open) { try { conn.send({ t: 'p', p: mine }); } catch (e) {} } };
        const wire = c => {
          conn = c;
          c.on('data', m => {
            if (m && m.t === 'p' && m.p && typeof m.p === 'object') { remote = m.p; remoteId = c.peer; }
            else if (m && m.t === 'c' && typeof m.m === 'string' && room.onChat) room.onChat(m.m.slice(0, 140));
          });
          c.on('open', send);
          c.on('close', () => { if (conn === c) { conn = null; remote = null; } });
          c.on('error', () => {});
        };
        const room = {
          presence(patch) { mine = Object.assign({}, mine, patch); send(); return Promise.resolve(); },
          // chat: say() returns false if there is no open connection; set onChat(text) to receive
          say(text) { if (!conn || !conn.open) return false; try { conn.send({ t: 'c', m: text }); return true; } catch (e) { return false; } },
          onChat: null,
          // voice: one-way audio call to the connected rival; incoming calls go to onCall(mediaConnection)
          call(stream) { if (!conn || !conn.open) return null; try { return peer.call(conn.peer, stream); } catch (e) { return null; } },
          onCall: null,
          peers() {
            const list = [{ peer: myId || 'me', presence: mine, sameTab: true, isMe: true }];
            if (remote && conn && conn.open) list.push({ peer: remoteId, presence: remote, sameTab: false, isMe: false });
            return list;
          },
          leave() { try { peer.destroy(); } catch (e) {} return Promise.resolve(); },
        };
        peer.on('open', id => {
          myId = id;
          if (role === 'guest') wire(peer.connect(PREFIX + name, { serialization: 'json' }));
          settled = true; resolve(room);
        });
        peer.on('connection', c => {
          if (role !== 'host') { c.close(); return; }
          if (conn && conn.open) { c.on('open', () => { try { c.send({ t: 'p', p: { role: 'host', code: mine.code, gp: 'full' } }); } catch (e) {} setTimeout(() => c.close(), 500); }); return; }
          wire(c);
        });
        peer.on('call', mc => {
          // only accept audio from the peer we're playing with
          if (!conn || !conn.open || mc.peer !== conn.peer || !room.onCall) { try { mc.close(); } catch (e) {} return; }
          room.onCall(mc);
        });
        peer.on('disconnected', () => { try { if (!peer.destroyed) peer.reconnect(); } catch (e) {} });
        peer.on('error', err => {
          const type = (err && err.type) || 'error';
          if (!settled) { settled = true; reject({ code: type === 'unavailable-id' ? 'sala ocupada, intenta de nuevo' : type }); }
        });
      });
    },
  };
}
