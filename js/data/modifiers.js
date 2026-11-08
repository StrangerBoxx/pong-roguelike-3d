/**
 * Modificadores de ronda (reglas especiales que cambian cada ronda).
 */
'use strict';

const MODS = [
  { id: 'classic', name: 'Clásico',        desc: 'Sin trucos' },
  { id: 'gravity', name: 'Gravedad',       desc: 'La bola cae hacia abajo' },
  { id: 'wind',    name: 'Vendaval',       desc: 'Ráfagas de viento vertical' },
  { id: 'dark',    name: 'Apagón',         desc: 'La bola se oculta en el centro' },
  { id: 'fast',    name: 'Hipervelocidad', desc: 'Bolas un 35% más rápidas' },
  { id: 'blocks',  name: 'Obstáculos',     desc: 'Bloques móviles en el centro' },
  { id: 'multi',   name: 'Caos',           desc: 'Cada saque lanza 2 bolas' },
  { id: 'tiny',    name: 'Mini',           desc: 'Paletas un 30% más pequeñas' },
  { id: 'warp',    name: 'Portal',         desc: 'Arriba y abajo están conectados' },
];
