/* MebelPro KG — 3D-сцена кухни на Three.js (r128).
   Модули строятся из реальных панелей (боковины, дно, царги, ХДФ, полки, фасады), поэтому
   «взорванный вид» разносит детали корпуса, а выбор модуля возвращает его параметры в интерфейс.
   Управление: ЛКМ — вращение, ПКМ/Shift — сдвиг, колесо/щипок — масштаб, клик — выбор модуля. */
(function () {
  const S = 100; // мм в одной единице сцены
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const VIEWS = {
    persp: (r) => ({ theta: 0.62, phi: 1.08, r: 50, target: V(r.L / 2 / S, 8, r.W / 2 / S) }),
    top: (r) => ({ theta: 0, phi: 0.02, r: 46, target: V(r.L / 2 / S, 0, r.W / 2 / S) }),
    front: (r) => ({ theta: 0, phi: 1.5, r: 44, target: V(r.L / 2 / S, 11, 0) }),
    side: (r) => ({ theta: Math.PI / 2, phi: 1.5, r: 42, target: V(0, 11, r.W / 2 / S) })
  };

  function label(text, color) {
    const c = document.createElement('canvas');
    c.width = 384; c.height = 72;
    const x = c.getContext('2d');
    x.font = '600 34px "JetBrains Mono", monospace';
    const w = Math.min(376, x.measureText(text).width + 28);
    x.fillStyle = 'rgba(255,255,255,0.94)';
    x.strokeStyle = color || '#006194'; x.lineWidth = 3;
    x.beginPath(); x.rect((384 - w) / 2, 8, w, 56); x.fill(); x.stroke();
    x.fillStyle = color || '#006194'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 192, 37);
    const tex = new THREE.CanvasTexture(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.set(5.6, 1.05, 1); s.renderOrder = 20;
    return s;
  }

  // Процедурная текстура декора: древесные волокна или прожилки мрамора
  function decorTexture(d) {
    if (!d.pattern) return null;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = d.color; x.fillRect(0, 0, 256, 256);
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    if (d.pattern === 'wood') {
      for (let i = 0; i < 70; i++) {
        const y = rnd() * 256, a = 0.05 + rnd() * 0.12;
        x.strokeStyle = rnd() < 0.55 ? `rgba(60,35,10,${a})` : `rgba(255,240,220,${a * 0.8})`;
        x.lineWidth = 0.6 + rnd() * 2.2;
        x.beginPath(); x.moveTo(0, y);
        for (let px = 0; px <= 256; px += 16) x.lineTo(px, y + Math.sin(px / 40 + i) * 2.5);
        x.stroke();
      }
    } else {
      for (let i = 0; i < 16; i++) {
        x.strokeStyle = `rgba(110,110,122,${0.08 + rnd() * 0.16})`;
        x.lineWidth = 0.5 + rnd() * 1.6;
        let px = rnd() * 256, py = 0;
        x.beginPath(); x.moveTo(px, py);
        while (py < 256) { px += (rnd() - 0.5) * 34; py += 10 + rnd() * 20; x.lineTo(px, py); }
        x.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  class Viewer {
    constructor(container, opts) {
      this.c = container;
      this.o = Object.assign({ autoRotate: false, wheelZoom: true, selectable: true, dims: true, touchScroll: false, onSelect: null, onChange: null }, opts);
      this.room = this.o.room;
      this.t = this.o.t || 16;
      this.hidden = new Set();
      this.selected = null;
      this.explodeT = 0; this.explodeGoal = 0;
      this.mode = 'day'; this.wire = false; this.wallsOn = true; this.dimsOn = this.o.dims;

      const R = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }));
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
      Object.assign(R.domElement.style, { display: 'block', width: '100%', height: '100%', touchAction: this.o.touchScroll ? 'pan-y' : 'none', outline: 'none' });
      container.appendChild(R.domElement);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 600);
      this.orbit = VIEWS.persp(this.room);
      this.goal = null;

      this.hemi = new THREE.HemisphereLight(0xffffff, 0xd9dee8, 0.62);
      this.scene.add(this.hemi);
      this.sun = new THREE.DirectionalLight(0xffffff, 0.8);
      this.sun.position.set(this.room.L / S + 18, 48, this.room.W / S + 30);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
      Object.assign(this.sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
      this.sun.target.position.set(this.room.L / 2 / S, 0, this.room.W / 2 / S);
      this.scene.add(this.sun, this.sun.target);
      this.ledLights = [new THREE.PointLight(0xffc27a, 0, 26, 1.4), new THREE.PointLight(0xffc27a, 0, 26, 1.4)];
      this.ledLights.forEach((l) => this.scene.add(l));

      this.mats = this.makeMats();
      this.fMats = {};
      this.applyDecor(this.o.decor || MP.defaultDecor);
      this.buildStatic();
      this.modRoot = new THREE.Group();
      this.scene.add(this.modRoot);
      this.selBox = new THREE.Box3Helper(new THREE.Box3(), 0x0284c7);
      this.selBox.material.depthTest = false; this.selBox.renderOrder = 15; this.selBox.visible = false;
      this.scene.add(this.selBox);
      this.raycaster = new THREE.Raycaster();
      this.setLighting('day');
      this.setModules(this.o.modules, this.t);
      this.bindInput();

      this.visible = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((e) => (this.visible = e[0].isIntersecting)).observe(container);
      this.resize();
      if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(container);
      else window.addEventListener('resize', () => this.resize());
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    makeMats() {
      const L = (c, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra || {}));
      const m = {
        carcass: L(0xf3f2ee), facade: L(0x30353d), top: L(0xb4824b), hdf: L(0xe6e2da), metal: L(0x9aa3ae), plinth: L(0x16181c),
        appl: L(0x1c1f25), glass: L(0x2a3442), wall: L(0xeef1f6, { transparent: true, opacity: 0.94 }), wallB: L(0xe9edf4, { transparent: true, opacity: 0.94 }),
        floor: L(0xd9d2c5), cold: L(0x0284c7), hot: L(0xef4444), socket: L(0xffffff), gas: L(0xeab308), sink: L(0xa9b1bb), hob: L(0x0d0f12),
        led: new THREE.MeshBasicMaterial({ color: 0xfff1d6 })
      };
      this.wireable = ['carcass', 'facade', 'top', 'hdf', 'metal', 'plinth', 'appl', 'glass', 'sink', 'hob'].map((k) => m[k]);
      return m;
    }

    box(sx, sy, sz, mat) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.max(sx, 0.01), Math.max(sy, 0.01), Math.max(sz, 0.01)), mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      return mesh;
    }

    buildStatic() {
      const r = this.room, L = r.L / S, W = r.W / S, H = r.H / S, M = this.mats;
      const g = (this.staticGroup = new THREE.Group());
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), M.floor);
      floor.rotation.x = -Math.PI / 2; floor.position.set(L / 2, 0, W / 2); floor.receiveShadow = true;
      g.add(floor);
      const grid = new THREE.GridHelper(Math.max(L, W), Math.max(L, W), 0x0284c7, 0xb9b2a5);
      grid.position.set(Math.max(L, W) / 2, 0.01, Math.max(L, W) / 2);
      grid.material.transparent = true; grid.material.opacity = 0.25;
      g.add(grid);
      this.wallA = this.box(L, H, 0.2, M.wall); this.wallA.position.set(L / 2, H / 2, -0.1); this.wallA.castShadow = false;
      this.wallB = this.box(0.2, H, W, M.wallB); this.wallB.position.set(-0.1, H / 2, W / 2); this.wallB.castShadow = false;
      g.add(this.wallA, this.wallB);
      const U = MP.utilitiesFor(this.room);
      U.water.filter((w) => w.x < this.room.L).forEach((w) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 16), w.hot ? M.hot : M.cold);
        c.rotation.x = Math.PI / 2; c.position.set(w.x / S, w.y / S, 0.25); g.add(c);
      });
      U.sockets.filter((s) => s.x < this.room.L).forEach((s) => { const b = this.box(0.8, 0.8, 0.2, M.socket); b.position.set(s.x / S, s.y / S, 0.1); g.add(b); });
      if (U.gas.x < this.room.L) {
      const gas = new THREE.Mesh(new THREE.CylinderGeometry(U.gas.r / S, U.gas.r / S, H, 12), M.gas);
      gas.position.set(U.gas.x / S, H / 2, U.gas.z / S); g.add(gas);
      }
      this.scene.add(g);
    }

    /* ---------- Модули ---------- */
    setModules(mods, t, decor) {
      this.mods = mods; if (t) this.t = t;
      if (decor) this.applyDecor(decor);
      this.modRoot.children.slice().forEach((ch) => { this.modRoot.remove(ch); ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
      this.panels = []; this.groups = {}; this.fronts = [];
      const runA = mods.filter((m) => m.z < 100 && ['base', 'oven', 'appliance', 'tall'].includes(m.type));
      const cx = runA.length ? (Math.min(...runA.map((m) => m.x)) + Math.max(...runA.map((m) => m.x + m.w))) / 2 : this.room.L / 2;
      mods.forEach((m) => {
        const g = this.buildModule(m);
        const off = m.type === 'island' ? V(0, 0, 2.2) : m.type === 'upper' ? V((m.x + m.w / 2 - cx) / S * 0.22, 1.6, 0) : V((m.x + m.w / 2 - cx) / S * 0.22, 0, 0);
        g.userData.off = off;
        g.visible = !this.hidden.has(m.id);
        this.groups[m.id] = g;
        this.modRoot.add(g);
      });
      this.buildTops(mods);
      this.buildDims(mods);
      this.applyWire();
      this.applyExplode(true);
      if (this.selected && !this.groups[this.selected]) this.selected = null;
      this.updateSel();
    }

    buildModule(m) {
      const M = this.mats, W = m.w / S, H = m.h / S, D = m.d / S, t = this.t / S;
      const FM = this.facadeMat(m.facade || this.decor.facade);
      const outer = new THREE.Group();
      outer.position.set(m.x / S, m.y / S, m.z / S);
      outer.userData = { mid: m.id, base: outer.position.clone() };
      const g = new THREE.Group();
      if (m.facing === '-z') { g.position.set(W, 0, D); g.rotation.y = Math.PI; }
      outer.add(g);
      const P = (sx, sy, sz, x, y, z, mat, dir, amt, parent) => {
        const mesh = this.box(sx, sy, sz, mat);
        mesh.position.set(x, y, z);
        mesh.userData.base = mesh.position.clone();
        mesh.userData.dir = V(dir[0], dir[1], dir[2]).multiplyScalar(amt === undefined ? 1.2 : amt);
        (parent || g).add(mesh); this.panels.push(mesh);
        return mesh;
      };
      const baseLike = ['base', 'oven', 'island'].includes(m.type);
      if (m.type !== 'appliance') {
        P(t, H, D, t / 2, H / 2, D / 2, M.carcass, [-1, 0, 0]);
        P(t, H, D, W - t / 2, H / 2, D / 2, M.carcass, [1, 0, 0]);
        P(W - 2 * t, t, D, W / 2, t / 2, D / 2, M.carcass, [0, -1, 0]);
        if (baseLike) {
          P(W - 2 * t, t, 0.8, W / 2, H - t / 2, D - 0.4, M.carcass, [0, 1, 0]);
          P(W - 2 * t, t, 0.8, W / 2, H - t / 2, 0.4, M.carcass, [0, 1, 0]);
        } else P(W - 2 * t, t, D, W / 2, H - t / 2, D / 2, M.carcass, [0, 1, 0]);
        if (!m.sink) P(W - 2 * t + 0.14, H - 0.2, 0.04, W / 2, H / 2, 0.18, M.hdf, [0, 0, -1], 1.6);
        const sd = D - 0.2, fill = m.fill || {}, n = m.shelves || 0, iw = W - 2 * t;
        const shelf = (y) => P(iw - 0.02, t, sd, W / 2, y, 0.2 + sd / 2, M.carcass, [0, 0, 1], 0.8);
        // Внутренние ящики — снизу корпуса
        const inner = m.type !== 'upper' ? fill.inner || 0 : 0;
        for (let i = 0; i < inner; i++) {
          const y0 = t + 0.1 + i * 1.7;
          P(iw - 0.3, 1.5, 0.16, W / 2, y0 + 0.75, D - 0.5, M.carcass, [0, 0, 1], 1.4);
          const tray = this.box(iw - 0.5, 1.1, D - 1.1, M.metal); tray.position.set(W / 2, y0 + 0.55, (D - 1.1) / 2 + 0.2); g.add(tray);
        }
        const lo = inner ? t + 0.1 + inner * 1.7 : 0;
        if (m.type === 'tall' && m.niche !== false) {
          P(iw, t, D, W / 2, 7.28, D / 2, M.carcass, [0, 0, 1], 0.6);
          P(iw, t, D, W / 2, 11.28, D / 2, M.carcass, [0, 0, 1], 0.6);
          const mw = this.box(iw - 0.3, 3.6, D - 1.4, M.appl); mw.position.set(W / 2, 9.28, D / 2 + 0.3); g.add(mw);
          const glass = this.box(Math.min(3.2, iw - 1), 2.2, 0.04, M.glass); glass.position.set(W / 2 - 0.6, 9.28, D - 0.38); g.add(glass);
          for (let i = 0; i < n; i++) shelf(11.28 + (H - 11.28) * (i + 1) / (n + 1));
        } else if (fill.rod) {
          // Платяной шкаф: верхняя полка, под ней штанга, остальные полки — внизу
          if (n) shelf(H - 3.2);
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, iw - 0.1, 12), M.metal);
          rod.rotation.z = Math.PI / 2; rod.position.set(W / 2, H - 3.8, D / 2); rod.castShadow = true; g.add(rod);
          for (let i = 1; i < n; i++) shelf(lo + (H * 0.38 - lo) * i / n);
        } else {
          for (let i = 0; i < n; i++) shelf(lo + (H - lo) * (i + 1) / (n + 1));
        }
        if (fill.dryer) [H * 0.3, H * 0.66].forEach((y) => {
          for (let k = 0; k < 9; k++) { const bar = this.box(0.05, 0.05, sd - 0.4, M.metal); bar.position.set(t + 0.4 + (iw - 0.8) * k / 8, y, 0.4 + sd / 2); g.add(bar); }
          const rail = this.box(iw - 0.2, 0.06, 0.06, M.metal); rail.position.set(W / 2, y, D - 0.4); g.add(rail);
        });
        if (m.type === 'oven') {
          const ov = this.box(W - 2 * t - 0.06, 5.9, D - 0.4, M.appl); ov.position.set(W / 2, 1.24 + 2.95, D / 2 + 0.2); g.add(ov);
          const gl = this.box(W - 1.4, 3.6, 0.03, M.glass); gl.position.set(W / 2, 4.0, D + 0.02); g.add(gl);
        }
      } else {
        const dw = this.box(W - 0.1, H - 0.2, D - 0.4, M.appl); dw.position.set(W / 2, H / 2, D / 2 - 0.1); g.add(dw);
      }
      if (baseLike || m.type === 'appliance' || m.type === 'tall') P(W, m.y / S - 0.02, 0.16, W / 2, -(m.y / S) / 2, D - 0.6, M.plinth, [0, -1, 0], 0.4);

      // Фасады
      MP.frontsFor(m).forEach((f) => {
        const fw = f.w / S, fh = f.h / S, fx = f.x / S, fy = f.y / S, ft = 0.18, z0 = D + 0.01;
        const pivot = new THREE.Group();
        let mesh;
        const handleW = Math.min(1.6, fw * 0.5);
        const addHandle = (parent, x, y) => { const h = this.box(handleW, 0.12, 0.2, M.metal); h.position.set(x, y, ft + 0.1); parent.add(h); };
        if (f.kind === 'door') {
          const left = f.hinge !== 'R';
          pivot.position.set(left ? fx : fx + fw, 0, z0);
          mesh = this.box(fw, fh, ft, FM); mesh.position.set(left ? fw / 2 : -fw / 2, fy + fh / 2, ft / 2); pivot.add(mesh);
          const hb = this.box(0.12, Math.min(1.6, fh * 0.3), 0.2, M.metal); hb.position.set(left ? fw - 0.35 : -fw + 0.35, m.type === 'upper' ? fy + 0.9 : fy + fh - 0.95, ft + 0.1); pivot.add(hb);
          this.fronts.push({ mid: m.id, obj: pivot, kind: 'rot', axis: 'y', open: left ? -1.85 : 1.85, cur: 0 });
        } else if (f.kind === 'lift') {
          pivot.position.set(fx, fy + fh, z0);
          mesh = this.box(fw, fh, ft, FM); mesh.position.set(fw / 2, -fh / 2, ft / 2); pivot.add(mesh);
          addHandle(pivot, fw / 2, -fh + 0.35);
          this.fronts.push({ mid: m.id, obj: pivot, kind: 'rot', axis: 'x', open: -1.6, cur: 0 });
        } else if (f.kind === 'appl') {
          pivot.position.set(fx, fy, z0);
          mesh = this.box(fw, fh, ft, FM); mesh.position.set(fw / 2, fh / 2, ft / 2); pivot.add(mesh);
          addHandle(pivot, fw / 2, fh - 0.4);
          this.fronts.push({ mid: m.id, obj: pivot, kind: 'rot', axis: 'x', open: 1.35, cur: 0 });
        } else {
          pivot.position.set(fx, fy, z0);
          mesh = this.box(fw, fh, ft, FM); mesh.position.set(fw / 2, fh / 2, ft / 2); pivot.add(mesh);
          if (f.kind === 'drawer') {
            addHandle(pivot, fw / 2, fh - 0.35);
            const tray = this.box(fw - 0.6, Math.min(fh - 0.4, 1.8), D - 0.6, M.metal); tray.position.set(fw / 2, Math.min(fh - 0.4, 1.8) / 2 + 0.2, -(D - 0.6) / 2); pivot.add(tray);
            this.fronts.push({ mid: m.id, obj: pivot, kind: 'slide', open: 4.2, cur: 0 });
          }
        }
        pivot.userData.base = pivot.position.clone();
        pivot.userData.dir = V(0, 0, 1.9);
        g.add(pivot); this.panels.push(pivot);
      });
      return outer;
    }

    buildTops(mods) {
      const M = this.mats, tt = MP.settings.topT / S;
      this.tops = [];
      const run = mods.filter((m) => m.z < 100 && ['base', 'oven', 'appliance'].includes(m.type) && !this.hidden.has(m.id) && !m.noTop);
      const mk = (x0, x1, z0, depth, y) => {
        const b = this.box(x1 - x0, tt, depth, M.top); b.position.set((x0 + x1) / 2, y + tt / 2, z0 + depth / 2);
        b.userData.base = b.position.clone(); b.userData.dir = V(0, 2.4, 0);
        this.modRoot.add(b); this.tops.push(b); return b;
      };
      if (run.length) {
        const x0 = Math.min(...run.map((m) => m.x)) / S, x1 = Math.max(...run.map((m) => m.x + m.w)) / S;
        const y = Math.max(...run.map((m) => m.y + m.h)) / S;
        mk(x0, x1, 0, 6, y);
        run.forEach((m) => {
          const W = m.w / S, X = m.x / S;
          if (m.sink) { const s = this.box(W * 0.7, 0.04, 4.2, M.sink); s.position.set(X + W / 2, y + tt + 0.02, 3); s.userData.base = s.position.clone(); s.userData.dir = V(0, 2.4, 0); this.modRoot.add(s); this.tops.push(s); }
          if (m.type === 'oven') { const h = this.box(W * 0.9, 0.04, 4.8, M.hob); h.position.set(X + W / 2, y + tt + 0.02, 3); h.userData.base = h.position.clone(); h.userData.dir = V(0, 2.4, 0); this.modRoot.add(h); this.tops.push(h); }
        });
      }
      const isl = mods.filter((m) => m.type === 'island' && !this.hidden.has(m.id));
      if (isl.length) {
        const x0 = Math.min(...isl.map((m) => m.x)) / S, x1 = Math.max(...isl.map((m) => m.x + m.w)) / S;
        const z0 = Math.min(...isl.map((m) => m.z)) / S - 0.4, y = Math.max(...isl.map((m) => m.y + m.h)) / S;
        const b = mk(x0, x1, z0, 9, y); b.userData.dir = V(0, 2.4, 2.2);
      }
      // Фальш-планки в цвет фасадов
      MP.fillersFor(mods, this.room).forEach((f) => {
        const b = this.box(f.w / S, f.h / S - 0.04, 0.18, this.facadeMat(this.decor.facade));
        b.position.set((f.x + f.w / 2) / S, (f.y + f.h / 2) / S, f.d / S + 0.1);
        b.userData.base = b.position.clone(); b.userData.dir = V(0, 0, 1.9);
        this.modRoot.add(b); this.tops.push(b);
      });
      // LED-подсветка под верхними шкафами
      this.leds = [];
      const ups = mods.filter((m) => m.type === 'upper' && !this.hidden.has(m.id) && m.h >= 500);
      ups.forEach((m) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(m.w / S - 0.3, 0.05, 0.12), M.led);
        b.position.set((m.x + m.w / 2) / S, m.y / S - 0.03, (m.z + m.d) / S - 0.35);
        b.userData.mid = m.id; this.modRoot.add(b); this.leds.push(b);
      });
      if (ups.length) {
        const xs = ups.map((m) => (m.x + m.w / 2) / S), y = Math.min(...ups.map((m) => m.y)) / S - 0.3;
        this.ledLights[0].position.set(Math.min(...xs), y, 2.2);
        this.ledLights[1].position.set(Math.max(...xs), y, 2.2);
      }
    }

    buildDims(mods) {
      if (this.dimGroup) { this.scene.remove(this.dimGroup); this.dimGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
      const g = (this.dimGroup = new THREE.Group());
      const mat = new THREE.LineBasicMaterial({ color: 0x0284c7, depthTest: false, transparent: true });
      const line = (a, b, tick) => {
        const pts = [a, b];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const l = new THREE.Line(geo, mat); l.renderOrder = 18; g.add(l);
        [a, b].forEach((p) => { const tg = new THREE.BufferGeometry().setFromPoints([p.clone().add(tick), p.clone().sub(tick)]); const tl = new THREE.Line(tg, mat); tl.renderOrder = 18; g.add(tl); });
      };
      const add = (a, b, tick, text, color) => { line(a, b, tick); const s = label(text, color); s.position.copy(a.clone().add(b).multiplyScalar(0.5)).add(V(0, 0.75, 0)); g.add(s); };
      const runA = mods.filter((m) => m.z < 100 && m.type !== 'upper');
      if (runA.length) {
        const x0 = Math.min(...runA.map((m) => m.x)), x1 = Math.max(...runA.map((m) => m.x + m.w));
        const y = Math.max(...mods.map((m) => m.y + m.h)) / S + 1.2;
        add(V(x0 / S, y, 0.4), V(x1 / S, y, 0.4), V(0, 0.4, 0), `${x1 - x0} мм`);
      }
      const isl = mods.filter((m) => m.type === 'island');
      if (isl.length) {
        const x0 = Math.min(...isl.map((m) => m.x)), x1 = Math.max(...isl.map((m) => m.x + m.w)), z = Math.max(...isl.map((m) => m.z + m.d)) / S + 3.3;
        add(V(x0 / S, 9.6, z), V(x1 / S, 9.6, z), V(0, 0.4, 0), `Остров ${x1 - x0} мм`);
        const zf = Math.min(...isl.map((m) => m.z)) - 40, xc = (x0 + x1) / 2 / S;
        add(V(xc, 0.1, 6), V(xc, 0.1, zf / S), V(0.4, 0, 0), `Проход ${Math.round(zf - 600)} мм`, zf - 600 >= 900 ? '#006a61' : '#ba1a1a');
      }
      g.visible = this.dimsOn;
      this.scene.add(g);
    }

    /* ---------- Декоры ---------- */
    setDecorMat(mat, d) {
      if (mat.map) mat.map.dispose();
      mat.map = decorTexture(d);
      mat.color.set(mat.map ? 0xffffff : d.color);
      mat.needsUpdate = true;
    }
    applyDecor(decor) {
      this.decor = Object.assign({}, MP.defaultDecor, decor);
      this.setDecorMat(this.mats.carcass, MP.decor('carcass', this.decor.carcass));
      this.setDecorMat(this.mats.top, MP.decor('top', this.decor.top));
    }
    facadeMat(key) {
      if (!this.fMats[key]) {
        const m = new THREE.MeshLambertMaterial();
        this.setDecorMat(m, MP.decor('facade', key));
        m.wireframe = this.wire;
        this.fMats[key] = m; this.wireable.push(m);
      }
      return this.fMats[key];
    }

    /* ---------- Публичные методы ---------- */
    select(id, silent) {
      this.selected = id && this.groups[id] ? id : null;
      this.updateSel();
      if (!silent && this.o.onSelect) this.o.onSelect(this.selected ? this.mods.find((m) => m.id === this.selected) : null);
    }
    updateSel() { this.selBox.visible = !!this.selected && !this.hidden.has(this.selected); }
    setExploded(on) { this.explodeGoal = on ? 1 : 0; return on; }
    toggleExploded() { return this.setExploded(this.explodeGoal === 0); }
    toggleOpen(id) {
      const list = this.fronts.filter((f) => f.mid === id);
      const open = !list.some((f) => f.target);
      list.forEach((f) => (f.target = open));
      return open;
    }
    setLighting(mode) {
      this.mode = mode;
      const night = mode === 'night';
      this.scene.background = new THREE.Color(night ? 0x111a2e : 0xf3f5f9);
      this.hemi.intensity = night ? 0.3 : 0.62;
      this.sun.intensity = night ? 0.12 : 0.8;
      this.ledLights.forEach((l) => (l.intensity = night ? 2.4 : 0));
      this.mats.led.color.set(night ? 0xffcf8a : 0xfff1d6);
      return mode;
    }
    setView(name) { this.goal = VIEWS[name](this.room); }
    setWireframe(on) { this.wire = on; this.applyWire(); return on; }
    applyWire() { this.wireable.forEach((m) => (m.wireframe = this.wire)); }
    setDims(on) { this.dimsOn = on; if (this.dimGroup) this.dimGroup.visible = on; return on; }
    setWalls(on) { this.wallsOn = on; return on; }
    setHidden(id, hide) {
      if (hide) this.hidden.add(id); else this.hidden.delete(id);
      if (this.groups[id]) this.groups[id].visible = !hide;
      this.setModules(this.mods); // пересобрать столешницы/подсветку
    }
    zoom(f) { this.goal = null; this.orbit.r = clamp(this.orbit.r * f, 10, 130); }
    focusSelected() {
      if (!this.selected) return;
      const b = new THREE.Box3().setFromObject(this.groups[this.selected]), c = b.getCenter(V(0, 0, 0));
      this.goal = { theta: this.orbit.theta, phi: this.orbit.phi, r: 24, target: c };
    }
    snapshot() { this.renderer.render(this.scene, this.camera); return this.renderer.domElement.toDataURL('image/png'); }

    applyExplode(force) {
      const e = this.explodeT;
      if (!force && this._lastE === e) return;
      this._lastE = e;
      this.panels.forEach((p) => { p.position.copy(p.userData.base).addScaledVector(p.userData.dir, e); if (p.userData.slideZ) p.position.z += p.userData.slideZ; });
      Object.values(this.groups).forEach((g) => g.position.copy(g.userData.base).addScaledVector(g.userData.off, e));
      (this.tops || []).forEach((p) => p.position.copy(p.userData.base).addScaledVector(p.userData.dir, e));
      (this.leds || []).forEach((l) => (l.visible = e < 0.05 && !this.hidden.has(l.userData.mid)));
    }

    /* ---------- Ввод ---------- */
    bindInput() {
      const el = this.renderer.domElement, pts = new Map();
      let down = null, moved = false, pinch = 0;
      const dist = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
      el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture(e.pointerId);
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { down = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; moved = false; }
        if (this.moveMode && e.button === 0 && pts.size === 1 && this.o.selectable) {
          const id = this.ray(e);
          if (id) {
            const m = this.mods.find((x) => x.id === id);
            this.dragPlane = new THREE.Plane(V(0, 1, 0), -(m.y + m.h / 2) / S);
            const hit = this.planeHit(e);
            if (hit) { this.drag = { id, m, start: hit, x0: m.x, z0: m.z, x: m.x, z: m.z }; this.select(id); }
          }
        }
        if (pts.size === 2) pinch = dist();
        this.interacting = true; this.goal = null;
      });
      el.addEventListener('pointermove', (e) => {
        const p = pts.get(e.pointerId);
        if (!p) { this.hover(e); return; }
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        if (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 5) moved = true;
        if (this.drag) {
          const hit = this.planeHit(e), d = this.drag, m = d.m;
          if (!hit) return;
          d.x = MP.snapX(this.mods, m, d.x0 + (hit.x - d.start.x) * S, this.room);
          if (m.type === 'island') d.z = Math.round(Math.max(0, Math.min(this.room.W - m.d, d.z0 + (hit.z - d.start.z) * S)) / 10) * 10;
          const g = this.groups[d.id];
          g.userData.base.set(d.x / S, m.y / S, d.z / S);
          g.position.copy(g.userData.base).addScaledVector(g.userData.off, this.explodeT);
          if (this.o.onDrag) this.o.onDrag(m, d.x, d.z);
          return;
        }
        if (pts.size === 2) { const d = dist(); if (pinch) this.orbit.r = clamp(this.orbit.r * pinch / d, 10, 130); pinch = d; return; }
        if (down.pan) {
          const k = this.orbit.r * 0.0016;
          const right = V(0, 0, 0).setFromMatrixColumn(this.camera.matrix, 0), up = V(0, 0, 0).setFromMatrixColumn(this.camera.matrix, 1);
          this.orbit.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
        } else {
          this.orbit.theta -= dx * 0.006;
          this.orbit.phi = clamp(this.orbit.phi - dy * 0.006, 0.02, 1.56);
        }
      });
      const up = (e) => {
        if (!pts.has(e.pointerId)) return;
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = 0;
        if (pts.size === 0) { this.interacting = false; if (this.drag) { const d = this.drag; this.drag = null; if (moved && (d.x !== d.x0 || d.z !== d.z0) && this.o.onMove) this.o.onMove(d.id, d.x, d.z); return; } if (!moved && this.o.selectable && e.button === 0) this.pick(e); }
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); if (!pts.size) this.interacting = false; });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      if (this.o.wheelZoom) el.addEventListener('wheel', (e) => { e.preventDefault(); this.goal = null; this.orbit.r = clamp(this.orbit.r * Math.exp(e.deltaY * 0.0012), 10, 130); }, { passive: false });
    }
    planeHit(e) {
      const r = this.renderer.domElement.getBoundingClientRect();
      this.raycaster.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, this.camera);
      const p = V(0, 0, 0);
      return this.raycaster.ray.intersectPlane(this.dragPlane, p) ? p : null;
    }
    floorPoint(e) {
      this.dragPlane = new THREE.Plane(V(0, 1, 0), 0);
      const p = this.planeHit(e);
      return p ? { x: p.x * S, z: p.z * S } : null;
    }
    setMoveMode(on) { this.moveMode = on; this.renderer.domElement.style.cursor = on ? 'move' : 'grab'; return on; }
    ray(e) {
      const r = this.renderer.domElement.getBoundingClientRect();
      this.raycaster.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, this.camera);
      const hits = this.raycaster.intersectObjects(Object.values(this.groups).filter((g) => g.visible), true);
      for (const h of hits) { let o = h.object; while (o && !(o.userData && o.userData.mid && this.groups[o.userData.mid] === o)) o = o.parent; if (o) return o.userData.mid; }
      return null;
    }
    pick(e) { this.select(this.ray(e)); }
    hover(e) {
      if (!this.o.selectable) return;
      const now = performance.now();
      if (now - (this._hv || 0) < 60) return;
      this._hv = now;
      this.renderer.domElement.style.cursor = this.ray(e) ? (this.moveMode ? 'move' : 'pointer') : 'grab';
    }

    resize() {
      const w = this.c.clientWidth || 600, h = this.c.clientHeight || 400;
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
    }

    loop() {
      requestAnimationFrame(this.loop);
      if (!this.visible) return;
      const o = this.orbit;
      if (this.goal) {
        const g = this.goal, k = 0.12;
        let dt = g.theta - o.theta; dt = Math.atan2(Math.sin(dt), Math.cos(dt));
        o.theta += dt * k; o.phi += (g.phi - o.phi) * k; o.r += (g.r - o.r) * k; o.target.lerp(g.target, k);
        if (Math.abs(dt) < 0.001 && Math.abs(g.phi - o.phi) < 0.001 && Math.abs(g.r - o.r) < 0.01) this.goal = null;
      } else if (this.o.autoRotate && !this.interacting) o.theta += 0.0016;
      const sp = Math.sin(o.phi);
      this.camera.position.set(o.target.x + o.r * sp * Math.sin(o.theta), o.target.y + o.r * Math.cos(o.phi), o.target.z + o.r * sp * Math.cos(o.theta));
      this.camera.lookAt(o.target);
      // Стены, оказавшиеся между камерой и кухней, прячем автоматически
      this.wallA.visible = this.wallsOn && this.camera.position.z > 0;
      this.wallB.visible = this.wallsOn && this.camera.position.x > 0;
      if (Math.abs(this.explodeT - this.explodeGoal) > 0.001) { this.explodeT += (this.explodeGoal - this.explodeT) * 0.12; if (Math.abs(this.explodeT - this.explodeGoal) < 0.002) this.explodeT = this.explodeGoal; }
      this.applyExplode();
      this.fronts.forEach((f) => {
        const goal = f.target ? f.open : 0;
        if (Math.abs(f.cur - goal) < 0.001) return;
        f.cur += (goal - f.cur) * 0.14;
        if (f.kind === 'slide') { f.obj.userData.slideZ = f.cur; f.obj.position.z = f.obj.userData.base.z + f.obj.userData.dir.z * this.explodeT + f.cur; }
        else f.obj.rotation[f.axis] = f.cur;
      });
      if (this.selBox.visible) this.selBox.box.setFromObject(this.groups[this.selected]);
      this.renderer.render(this.scene, this.camera);
    }
  }

  window.MP3D = { create: (container, opts) => new Viewer(container, opts) };
})();
