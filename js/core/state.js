/**
 * Estado mutable global de la partida. Lo comparten todos los sistemas.
 * state: title | draft | serve | play | roundEnd | matchEnd
 */
'use strict';

// flujo
let state = 'title', paused = false, T = 0;
// entidades
let P = [], balls = [], parts = [], obstacles = [], floats = [], rings = [];
// ronda
let mod = MODS[0], roundNum = 0, serveTimer = 0, serveDir = 1, slowT = 0;
let draft = null, endT = 0, lastLoser = -1, winner = null, banner = null;
// eventos de cámara
let ev = null, nextEv = 15;
// game feel
let shake = 0, flash = 0, hitStop = 0;
// renderer 3D (se crea en main.js)
let R3 = null;
