/**
 * Cartas de mejora (pasivas y habilidades activas) y tabla de rarezas.
 */
'use strict';

const RAR = [
  { name: 'COMÚN', color: '#9fb3c8', w: 60 },
  { name: 'RARA', color: '#4da3ff', w: 30 },
  { name: 'ÉPICA', color: '#c77dff', w: 12 },
];
const CARDS = [
  { id: 'long',   icon: '📏', name: 'Paleta XL',    rar: 0, max: 4, desc: '+22% de tamaño de paleta.' },
  { id: 'fast',   icon: '⚡', name: 'Turbo',        rar: 0, max: 4, desc: '+18% de velocidad de paleta.' },
  { id: 'power',  icon: '💥', name: 'Golpe fuerte', rar: 0, max: 4, desc: 'Tus golpes aceleran más la bola.' },
  { id: 'spin',   icon: '🌀', name: 'Efecto',       rar: 0, max: 3, desc: 'Mover la paleta al golpear curva la bola.' },
  { id: 'shrink', icon: '🧿', name: 'Maldición',    rar: 1, max: 3, desc: 'La paleta rival se encoge un 12%.' },
  { id: 'shield', icon: '🛡️', name: 'Escudo',       rar: 1, max: 3, desc: 'Bloquea 1 gol en tu contra por ronda.' },
  { id: 'magnet', icon: '🧲', name: 'Imán',         rar: 1, max: 3, desc: 'La bola se desvía hacia tu paleta.' },
  { id: 'ghost',  icon: '👻', name: 'Fantasma',     rar: 1, max: 3, desc: 'Tras tu golpe, la bola es invisible en el centro.' },
  { id: 'cool',   icon: '⏱️', name: 'Recarga',      rar: 1, max: 2, desc: 'Tu habilidad se recarga un 25% más rápido.' },
  { id: 'multi',  icon: '🧬', name: 'Mitosis',      rar: 2, max: 3, desc: '20% de probabilidad de dividir la bola al golpear.' },
  { id: 'twin',   icon: '👯', name: 'Gemela',       rar: 2, max: 1, desc: 'Una mini-paleta espejo defiende tu mitad.' },
  { id: 'crit',   icon: '🎯', name: 'Crítico',      rar: 2, max: 2, desc: '25% de que tus goles valgan doble.' },
  { id: 'a_dash',   icon: '💨', name: 'Dash',         rar: 0, active: true, cd: 2.5, desc: 'HABILIDAD: impulso veloz de la paleta. (2.5s)' },
  { id: 'a_smash',  icon: '☄️', name: 'Remate',       rar: 1, active: true, cd: 6,   desc: 'HABILIDAD: tu próximo golpe sale disparado. (6s)' },
  { id: 'a_slow',   icon: '🐢', name: 'Cámara lenta', rar: 1, active: true, cd: 8,   desc: 'HABILIDAD: ralentiza todas las bolas 1.6s. (8s)' },
  { id: 'a_freeze', icon: '❄️', name: 'Congelar',     rar: 1, active: true, cd: 9,   desc: 'HABILIDAD: congela al rival 0.8s. (9s)' },
  { id: 'a_wall',   icon: '🧱', name: 'Muralla',      rar: 2, active: true, cd: 12,  desc: 'HABILIDAD: muro en tu portería 2.5s. (12s)' },
];
const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));
