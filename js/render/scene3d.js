/**
 * Escena 3D con Three.js: mesa, paletas, bolas, partículas, cámara y bloom.
 */
'use strict';

let demo = { x: 300, y: 200, vx: 260, vy: 180 };

function make3D() {
  if (!window.THREE) return null;
  const T3 = THREE, S = 0.02;
  const gx = x => (x - W / 2) * S, gz = y => (y - H / 2) * S;
  const glc = document.getElementById('g');
  let renderer;
  try { renderer = new T3.WebGLRenderer({ canvas: glc, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap;
  renderer.setClearColor(0x04040c);
  const scene = new T3.Scene();
  scene.fog = new T3.Fog(0x04040c, 22, 45);
  const cam = new T3.PerspectiveCamera(42, W / H, 0.1, 200);
  const camPos = new T3.Vector3(0, 30, 30), camLook = new T3.Vector3(0, 0, 0);

  const amb = new T3.AmbientLight(0x6670aa, 0.55); scene.add(amb);
  const sun = new T3.DirectionalLight(0xffffff, 0.55);
  sun.position.set(2, 18, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 9, bottom: -9, near: 1, far: 40 });
  scene.add(sun);

  const FW = W * S, FD = H * S;
  // floor
  const floor = new T3.Mesh(new T3.PlaneGeometry(FW + 1.6, FD + 1.6),
    new T3.MeshStandardMaterial({ color: 0x0b0b26, roughness: 0.55, metalness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  // base slab
  const slab = new T3.Mesh(new T3.BoxGeometry(FW + 1.6, 0.6, FD + 1.6), new T3.MeshStandardMaterial({ color: 0x06061a, roughness: 0.9 }));
  slab.position.y = -0.31; scene.add(slab);
  // grid
  const gp = [];
  for (let x = 0; x <= W; x += 40) gp.push(gx(x), 0.005, -FD / 2, gx(x), 0.005, FD / 2);
  for (let y = 0; y <= H; y += 40) gp.push(-FW / 2, 0.005, gz(y), FW / 2, 0.005, gz(y));
  const gg = new T3.BufferGeometry(); gg.setAttribute('position', new T3.Float32BufferAttribute(gp, 3));
  scene.add(new T3.LineSegments(gg, new T3.LineBasicMaterial({ color: 0x5560ff, transparent: true, opacity: 0.12 })));
  // centre dashes
  const dashMat = new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
  for (let y = 10; y < H; y += 30) {
    const d = new T3.Mesh(new T3.BoxGeometry(0.08, 0.01, 16 * S), dashMat);
    d.position.set(0, 0.01, gz(y + 8)); scene.add(d);
  }
  // rails
  const railMat = new T3.MeshStandardMaterial({ color: 0x3344ff, emissive: 0x3344ff, emissiveIntensity: 0.9 });
  const rails = [-1, 1].map(sg => {
    const m = new T3.Mesh(new T3.BoxGeometry(FW + 0.4, 0.28, 0.16), railMat);
    m.position.set(0, 0.14, sg * (FD / 2 + 0.08)); m.castShadow = true; scene.add(m); return m;
  });
  // goal strips
  [0, 1].forEach(i => {
    const m = new T3.Mesh(new T3.BoxGeometry(0.06, 0.02, FD), new T3.MeshBasicMaterial({ color: COLORS[i], transparent: true, opacity: 0.45 }));
    m.position.set(i ? FW / 2 : -FW / 2, 0.01, 0); scene.add(m);
  });

  const col = c => new T3.Color(c);
  const paddles = [0, 1].map(i => {
    const mat = new T3.MeshStandardMaterial({ color: COLORS[i], emissive: COLORS[i], emissiveIntensity: 0.85, roughness: 0.3, metalness: 0.2 });
    const m = new T3.Mesh(new T3.BoxGeometry(1, 1, 1), mat); m.castShadow = true; scene.add(m);
    const tw = new T3.Mesh(new T3.BoxGeometry(1, 1, 1), mat); tw.castShadow = true; tw.visible = false; scene.add(tw);
    const light = new T3.PointLight(COLORS[i], 1.2, 7); scene.add(light);
    const shield = new T3.Mesh(new T3.BoxGeometry(0.05, 0.7, FD), new T3.MeshBasicMaterial({ color: COLORS[i], transparent: true, opacity: 0.4, blending: T3.AdditiveBlending, depthWrite: false }));
    shield.position.set(i ? FW / 2 : -FW / 2, 0.35, 0); scene.add(shield);
    const wall = new T3.Mesh(new T3.BoxGeometry(0.16, 1.3, FD), new T3.MeshBasicMaterial({ color: COLORS[i], transparent: true, opacity: 0.5, blending: T3.AdditiveBlending, depthWrite: false }));
    wall.position.set(gx(i ? W - 14 : 14), 0.65, 0); scene.add(wall);
    const ice = new T3.Mesh(new T3.BoxGeometry(1, 1, 1), new T3.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.35, depthWrite: false }));
    scene.add(ice);
    return { m, tw, mat, light, shield, wall, ice };
  });
  const BR = 0.2;
  const ballGeo = new T3.SphereGeometry(BR, 20, 14), trailGeo = new T3.SphereGeometry(BR, 8, 6);
  const ballPool = [], trailPool = [];
  for (let i = 0; i < 8; i++) {
    const m = new T3.Mesh(ballGeo, new T3.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9, transparent: true }));
    m.castShadow = true; m.visible = false; scene.add(m); ballPool.push(m);
    const tr = [];
    for (let k = 0; k < 16; k++) {
      const t = new T3.Mesh(trailGeo, new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, blending: T3.AdditiveBlending, depthWrite: false }));
      t.visible = false; scene.add(t); tr.push(t);
    }
    trailPool.push(tr);
  }
  const ballLight = new T3.PointLight(0xffffff, 1.0, 5); scene.add(ballLight);
  const ringGeo = new T3.RingGeometry(0.82, 1, 48);
  const ringPool = [];
  for (let i = 0; i < 24; i++) {
    const m = new T3.Mesh(ringGeo, new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.visible = false; scene.add(m); ringPool.push(m);
  }
  // card-driven paddle decorations
  const deco = [0, 1].map(i => {
    const add = m => { m.visible = false; scene.add(m); return m; };
    const addMat = c => new T3.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, blending: T3.AdditiveBlending, depthWrite: false });
    return {
      mag: [0, 1, 2].map(() => add(new T3.Mesh(new T3.TorusGeometry(1, 0.03, 8, 40), addMat(0x4da3ff)))),
      spin: add(new T3.Mesh(new T3.TorusGeometry(0.35, 0.035, 8, 32), addMat(0xc77dff))),
      crit: add(new T3.Mesh(new T3.BoxGeometry(1, 0.06, 1), addMat(0xffe66d))),
      power: [0, 1].map(() => add(new T3.Mesh(new T3.BoxGeometry(1, 1, 1), addMat(0xff6b3c)))),
      ready: add(new T3.Mesh(new T3.SphereGeometry(0.12, 12, 8), addMat(0xffffff))),
    };
  });
  const obsMat = new T3.MeshStandardMaterial({ color: 0xffe66d, emissive: 0xffe66d, emissiveIntensity: 0.6 });
  const obsPool = [0, 1, 2].map(() => { const m = new T3.Mesh(new T3.BoxGeometry(1, 1, 1), obsMat); m.castShadow = true; m.visible = false; scene.add(m); return m; });
  // particles
  const MAXP = 900, pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3);
  const pGeo = new T3.BufferGeometry();
  pGeo.setAttribute('position', new T3.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T3.BufferAttribute(pCol, 3));
  const pts = new T3.Points(pGeo, new T3.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false; scene.add(pts);
  const tmpC = new T3.Color();
  // stars
  const sp = [];
  for (let i = 0; i < 500; i++) { const a = Math.random() * Math.PI * 2, r = rnd(20, 60); sp.push(Math.cos(a) * r, rnd(-15, 25), Math.sin(a) * r); }
  const sg = new T3.BufferGeometry(); sg.setAttribute('position', new T3.Float32BufferAttribute(sp, 3));
  scene.add(new T3.Points(sg, new T3.PointsMaterial({ color: 0x8888ff, size: 0.12, transparent: true, opacity: 0.6 })));

  let composer = null, bloom = null;
  if (T3.EffectComposer && T3.RenderPass && T3.UnrealBloomPass) {
    try {
      composer = new T3.EffectComposer(renderer);
      composer.addPass(new T3.RenderPass(scene, cam));
      bloom = new T3.UnrealBloomPass(new T3.Vector2(W, H), 0.85, 0.45, 0.2);
      composer.addPass(bloom);
    } catch (e) { composer = null; }
  }

  function resize3(w, h) {
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  const v3 = new T3.Vector3();
  function project(x, y, hgt) {
    v3.set(gx(x), hgt, gz(y)).project(cam);
    return { x: (v3.x + 1) / 2 * W, y: (1 - v3.y) / 2 * H };
  }
  function placePaddle(o, x, y, w, h, color) {
    o.m.position.set(gx(x), 0.35, gz(y)); o.m.scale.set(Math.max(w * S, 0.2), 0.7, h * S);
    o.mat.color.set(color); o.mat.emissive.set(color);
    o.light.position.set(gx(x) + (x < W / 2 ? 0.8 : -0.8), 1.2, gz(y)); o.light.color.set(color);
  }

  function render3(dt) {
    // camera
    let tp, tl = new T3.Vector3(0, 0, 0.5);
    if (state === 'title') {
      const a = T * 0.18;
      tp = new T3.Vector3(Math.sin(a) * 17, 9 + Math.sin(T * 0.3) * 2, Math.cos(a) * 17); tl.set(0, 0, 0);
    } else if (state === 'draft' || state === 'matchEnd') {
      tp = new T3.Vector3(Math.sin(T * 0.1) * 4, 19, 15);
    }
    const ec = eventCam();
    const inGame = !tp;
    if (inGame) {
      const yaw = ec.yaw + Math.sin(T * 0.25) * 0.02;
      let hgt = 17.5, dist = 14.5;
      hgt = hgt + (25 - hgt) * ec.top; dist = dist + (0.6 - dist) * ec.top;
      hgt = hgt + (12 - hgt) * ec.side; dist = dist + (16 - dist) * ec.side;
      tp = new T3.Vector3(Math.sin(yaw) * dist, hgt, Math.cos(yaw) * dist);
      tl.set(Math.sin(yaw) * 0.5, 0, Math.cos(yaw) * 0.5 * (1 - ec.top));
    }
    const k = inGame ? 1 - Math.pow(0.0005, dt) : 1 - Math.pow(0.02, dt);
    camPos.lerp(tp, k); camLook.lerp(tl, k);
    cam.position.copy(camPos);
    if (shake) cam.position.add(new T3.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(shake * 0.02));
    cam.up.set(0, 1, 0);
    cam.lookAt(camLook);
    if (inGame && ec.roll) cam.rotateZ(ec.roll);

    const dark = mod.id === 'dark' && state !== 'title';
    amb.intensity = dark ? 0.15 : 0.55; sun.intensity = dark ? 0.12 : 0.55;
    const warp = mod.id === 'warp' && state !== 'title';
    railMat.color.set(warp ? 0xc77dff : 0x3344ff); railMat.emissive.set(warp ? 0xc77dff : 0x3344ff);
    railMat.emissiveIntensity = warp ? 0.6 + 0.5 * Math.sin(T * 5) : 0.9;

    // paddles
    if (state === 'title') {
      demo.x += demo.vx * dt; demo.y += demo.vy * dt;
      if (demo.x < 60 || demo.x > W - 60) demo.vx *= -1;
      if (demo.y < 10 || demo.y > H - 10) demo.vy *= -1;
      for (let i = 0; i < 2; i++) {
        const o = paddles[i]; placePaddle(o, i ? W - 36 : 36, clamp(demo.y, 60, H - 60), 14, 100, COLORS[i]);
        o.tw.visible = false; o.shield.visible = false; o.wall.visible = false; o.ice.visible = false;
        o.mat.transparent = false; o.mat.opacity = 1;
        const dc = deco[i]; dc.mag.forEach(r => r.visible = false); dc.power.forEach(r => r.visible = false);
        dc.spin.visible = dc.crit.visible = dc.ready.visible = false;
      }
    } else {
      for (const p of P) {
        const o = paddles[p.i];
        let c = p.frozen > 0 ? '#bfefff' : p.color;
        if (p.smash && Math.sin(T * 20) > 0) c = '#ffe66d';
        if (p.hitT > 0) c = '#ffffff';
        placePaddle(o, p.x, p.y, p.w, p.h, c);
        o.m.position.y = 0.35 + (p.hitT > 0 ? 0.12 : 0);
        o.tw.visible = !!L(p, 'twin');
        if (o.tw.visible) { o.tw.position.set(gx(p.i === 0 ? W * 0.3 : W * 0.7), 0.3, gz(H - p.y)); o.tw.scale.set(10 * S, 0.6, 56 * S); }
        o.shield.visible = p.shield > 0; o.shield.material.opacity = 0.25 + 0.15 * Math.sin(T * 5);
        o.wall.visible = p.wallT > 0; o.wall.material.opacity = Math.min(0.55, p.wallT * 0.5);
        // breathing when ability ready
        o.mat.emissiveIntensity = (p.active && p.cd <= 0) ? 0.85 + 0.45 * (0.5 + 0.5 * Math.sin(T * 6)) : 0.85;
        o.mat.transparent = !!L(p, 'ghost'); o.mat.opacity = L(p, 'ghost') ? 0.55 + 0.25 * Math.sin(T * 9) : 1;
        const dc = deco[p.i], px3 = gx(p.x), pz3 = gz(p.y), hz = p.h * S;
        const ml = L(p, 'magnet');
        dc.mag.forEach((r, k) => {
          r.visible = k < ml;
          if (r.visible) {
            const ph = (T * 1.6 + k / 3) % 1;
            r.position.set(px3, 0.35, pz3); r.rotation.set(0, Math.PI / 2, 0);
            r.scale.setScalar(0.2 + ph * (hz * 0.6)); r.material.opacity = 0.7 * (1 - ph);
          }
        });
        dc.spin.visible = !!L(p, 'spin');
        if (dc.spin.visible) { dc.spin.position.set(px3, 0.95, pz3); dc.spin.rotation.set(Math.PI / 2, T * 5, 0); dc.spin.rotation.x = Math.PI / 2 + Math.sin(T * 3) * 0.3; dc.spin.rotation.z = T * 6; }
        dc.crit.visible = !!L(p, 'crit');
        if (dc.crit.visible) { dc.crit.position.set(px3, 0.72, pz3); dc.crit.scale.set(p.w * S, 1, hz); dc.crit.material.opacity = 0.5 + 0.4 * Math.sin(T * 4); }
        const pw = L(p, 'power');
        dc.power.forEach((m, k) => {
          m.visible = pw > 0;
          if (m.visible) { m.position.set(px3, 0.35, pz3 + (k ? 1 : -1) * (hz / 2 + 0.05)); m.scale.set(p.w * S + 0.06 * pw, 0.75, 0.1); m.material.opacity = 0.35 + 0.15 * pw; }
        });
        dc.ready.visible = !!p.active && p.cd <= 0;
        if (dc.ready.visible) { dc.ready.position.set(px3, 1.05 + 0.08 * Math.sin(T * 5), pz3); dc.ready.material.color.set(p.color); }
        o.ice.visible = p.frozen > 0;
        if (o.ice.visible) { o.ice.position.copy(o.m.position); o.ice.scale.set(p.w * S + 0.2, 0.95, p.h * S + 0.2); }
      }
    }
    // balls
    const list = state === 'title' ? [{ x: demo.x, y: demo.y, owner: -1, trail: [], ghost: 0 }] : balls;
    for (let i = 0; i < ballPool.length; i++) {
      const m = ballPool[i], b = list[i], tr = trailPool[i];
      if (!b) { m.visible = false; tr.forEach(t => t.visible = false); continue; }
      const a = state === 'title' ? 1 : ballAlpha(b);
      const cc = b.owner >= 0 && P[b.owner] ? P[b.owner].color : '#ffffff';
      const spd = Math.hypot(b.vx || 0, b.vy || 0);
      const heat = state === 'title' ? 0 : clamp((spd - baseSpeed()) / (maxSpeed() - baseSpeed()), 0, 1.3);
      const hot = heat < 0.5 ? col('#ffffff').lerp(col('#ffd23c'), heat * 2) : col('#ffd23c').lerp(col('#ff3b2f'), Math.min(1, (heat - 0.5) * 2));
      m.visible = true; m.position.set(gx(b.x), BR + 0.02, gz(b.y));
      m.material.opacity = a; m.material.emissive.copy(hot).lerp(col(cc), 0.25); m.material.color.copy(hot);
      m.castShadow = a > 0.5;
      // stretch along velocity, squash on impact
      b.squash = Math.max(0, (b.squash || 0) - dt);
      const st = 1 + 0.55 * Math.min(1, heat), sq = b.squash > 0 ? 0.6 : 1;
      m.rotation.set(0, -Math.atan2(b.vy || 0, b.vx || 1), 0);
      m.scale.set(st * sq, (b.squash > 0 ? 1.25 : 1) / Math.sqrt(st), (b.squash > 0 ? 1.25 : 1) / Math.sqrt(st));
      for (let k = 0; k < tr.length; k++) {
        const t = tr[k], e = b.trail[k];
        if (!e) { t.visible = false; continue; }
        const n = Math.round(5 + 11 * Math.min(1, heat)), start = b.trail.length - n;
        if (k < start) { t.visible = false; continue; }
        const f = (k - start + 1) / n;
        t.visible = true; t.position.set(gx(e.x), BR + 0.02, gz(e.y)); t.scale.setScalar(f * 0.9 + 0.05);
        t.material.color.copy(col(cc)).lerp(hot, heat > 0.2 ? 0.7 : 0.2); t.material.opacity = a * f * (0.3 + 0.25 * Math.min(1, heat));
      }
      if (i === 0) { ballLight.position.set(gx(b.x), 0.8, gz(b.y)); ballLight.intensity = 1.0 * a; ballLight.color.copy(hot); }
    }
    if (!list.length) ballLight.intensity = 0;
    // obstacles
    for (let i = 0; i < obsPool.length; i++) {
      const m = obsPool[i], o = state === 'title' ? null : obstacles[i];
      m.visible = !!o;
      if (o) { m.position.set(gx(o.x + o.w / 2), 0.4, gz(o.y + o.h / 2)); m.scale.set(o.w * S, 0.8, o.h * S); }
    }
    // shock rings
    for (let i = 0; i < ringPool.length; i++) {
      const m = ringPool[i], r = state === 'title' ? null : rings[i];
      m.visible = !!r;
      if (r) {
        const f = r.t / r.max;
        m.position.set(gx(r.x), 0.03, gz(r.y));
        m.scale.setScalar(0.15 + f * 1.3 * r.size);
        m.material.color.set(r.color); m.material.opacity = (1 - f) * 0.8;
      }
    }
    // particles
    const n = Math.min(parts.length, MAXP);
    for (let i = 0; i < MAXP; i++) {
      if (i < n) {
        const q = parts[i], f = clamp(q.life / q.max, 0, 1);
        pPos[i * 3] = gx(q.x); pPos[i * 3 + 1] = q.h; pPos[i * 3 + 2] = gz(q.y);
        tmpC.set(q.color); pCol[i * 3] = tmpC.r * f; pCol[i * 3 + 1] = tmpC.g * f; pCol[i * 3 + 2] = tmpC.b * f;
      } else { pPos[i * 3 + 1] = -50; }
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    if (composer) composer.render(); else renderer.render(scene, cam);
  }
  return { render: render3, resize: resize3, project };
}
