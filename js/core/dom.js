/**
 * Referencias al DOM y al canvas 2D de overlay (HUD).
 */
'use strict';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let K = 1;

const $ = id => document.getElementById(id);
