// Tetra — CADD: 3D-цепочка монет в SECTION_CADD-BACKED (Three.js, WebGL).
// Исходник — coins.html. Подключать как модуль:
//   <script type="module" src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-cadd-coins.js"></script>
// Рендер идёт только пока полоса в зоне видимости; prefers-reduced-motion —
// статичный кадр; ?t=2.5 — один замороженный кадр (для проверки);
// ?perf=coins выключает (остаётся статичная картинка из Webflow).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm';
import { TessellateModifier } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/modifiers/TessellateModifier.js/+esm';

(function main() {

  // Motion and finish controls. Distances are in coin radii; timing is in seconds.
  const CFG = {
    spacing: 1.30,
    depthStep: 1.68,       // dense in projection, separated in 3D throughout the flip
    drift: 0.105,         // world units / second
    turnPeriod: 42,       // nominal spin period, with the spatial wave added below
    redStart: -3.9,       // стартовая x красной монеты (−3.9 ≈ вторая слева; было 1.3 — правее центра)
    red: 0xff061c,
    silver: 0x858a8b,
  };

  // Монтирование в SECTION_CADD-BACKED: сцена встаёт в .cadd-backed_coins-wrap
  // вместо статичной картинки .cadd-backed_coins (картинка остаётся фолбэком,
  // если WebGL недоступен). Канвас — пропорции 1608:823, по центру полосы.
  const wrap = document.querySelector('.section_cadd-backed .cadd-backed_coins-wrap');
  if (!wrap || (window.Tetra && window.Tetra.off && window.Tetra.off('coins'))) return;
  const el = document.createElement('div');
  el.className = 'cadd-backed_coins-canvas';
  Object.assign(el.style, {
    position: 'absolute', left: '0', top: '50%', width: '100%',
    aspectRatio: '1608 / 823', transform: 'translateY(-50%)', pointerEvents: 'none',
  });
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    return; // WebGL недоступен — остаётся статичная картинка
  }
  wrap.appendChild(el);
  const staticImg = wrap.querySelector('.cadd-backed_coins');
  if (staticImg) staticImg.style.visibility = 'hidden';
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // фон прозрачный: под канвасом фон секции (#0a0807)
  const pmrem = new THREE.PMREMGenerator(renderer);
  // Studio environment: dark room with a few bright softboxes — gives crisp metal reflections
  function studio() {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x050505);
    const box = (w, h, x, y, z, v) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(12, 3, -3, 6, 4, 3.2); // wide overhead strip: bright chamfers
    box(3, 10, -6, 2, 5, 2.6);  // narrow vertical highlight
    box(3, 8, -7, 1, -3, 3.0); // bright left chamfer, separate from the dark face
    box(4, 8, 7, 3, -3, 0.9);  // back rim
    box(3.5, 5, 7, 6, -2, 2.0);  // frontal upper strip for the red face
    box(7, 4, 3, 7, -5, 0.25); // silver sweep on the flatter coins
    box(8, 2, -2, -4, -9, 0.6); // lower rear strip reveals the nearly edge-on reverse faces
    box(8, 2, 2, 4, -9, 0.65); // broad reflection on the upper face during the turn
    box(1.8, 7, 4, 6, -6, 2.2); // soft reflected stripe across the brushed faces
    box(10, 2, 1, -5, 4, 0.7);  // restrained lower reflection
    box(10, 9, 1, 0, 9, 0.12); // dim face fill, leaving dark areas between panels
    return env;
  }
  const studioScene = studio();
  const environment = pmrem.fromScene(studioScene, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.0;
  studioScene.traverse(object => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(4, -2, -3);
  scene.add(rim);

  // Orthographic framing keeps equal-sized coins across the chain, as in the reference.
  const camera = new THREE.OrthographicCamera(-4.85, 4.85, 2.48, -2.48, 0.1, 100);
  camera.position.set(0, 0, 35);

  // Rounded chamfers, a shallow inset face and a narrow rolled rim.
  const T = 0.085;
  const top = [
    [.868, T], [.878, T - .004], [.884, T - .006],
    [.891, T - .003], [.898, T + .006], [.908, T + .011],
    [.925, T + .011], [.949, T + .011], [.965, T + .011], [.977, T + .007], [.987, T - .005],
    [.997, T - .018], [1, T - .033],
  ];
  const profile = [...top, ...top.slice().reverse().map(([x, y]) => [x, -y])].reverse() // bottom → top, so normals face out
    .map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 160);
  // Lathe v follows point index; remap it to real distance along the profile so the texture isn't squashed
  {
    const len = [0];
    for (let j = 1; j < profile.length; j++) len.push(len[j - 1] + profile[j].distanceTo(profile[j - 1]));
    const uv = bodyGeo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setY(k, len[k % profile.length] / len[len.length - 1]);
  }

  // Split the lathe into two material groups without adding draw calls per segment.
  {
    const edge = [], lip = [];
    const indices = bodyGeo.index.array;
    const stride = profile.length - 1;
    for (let i = 0; i < indices.length; i += 6) {
      const j = (i / 6) % stride;
      const r = (profile[j].x + profile[j + 1].x) / 2;
      (r < .978 ? lip : edge).push(...indices.slice(i, i + 6));
    }
    bodyGeo.setIndex([...edge, ...lip]);
    bodyGeo.clearGroups();
    bodyGeo.addGroup(0, edge.length, 0);
    bodyGeo.addGroup(edge.length, lip.length, 1);
  }

  // Fine, deterministic straight brushing on the faces and circumferential brushing on the edge.
  // Keep the height very subtle: visible scratches should not break up the softbox reflections.
  function brushed(planar) {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d');
    g.fillStyle = '#b8b8b8';
    g.fillRect(0, 0, 1024, 1024);
    let seed = 71;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const grain = g.createImageData(1024, 1024);
    for (let i = 0; i < grain.data.length; i += 4) {
      const v = 178 + Math.floor(random() * 13);
      grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v;
      grain.data[i + 3] = 255;
    }
    g.putImageData(grain, 0, 0);
    for (let i = 0; i < 5000; i++) {
      const v = 145 + Math.floor(random() * 85);
      g.strokeStyle = `rgba(${v},${v},${v},0.25)`;
      g.lineWidth = 0.35 + random() * 0.5;
      const y = random() * 1024;
      const x = planar ? random() * 1024 : 0;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(planar ? x + 80 + random() * 400 : 1024, y);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const edgeBrush = brushed(false);
  const faceBrush = brushed(true);
  // A very restrained albedo variation makes the brushing readable between highlights.
  const finishCanvas = document.createElement('canvas');
  finishCanvas.width = finishCanvas.height = 1024;
  const finishContext = finishCanvas.getContext('2d');
  finishContext.drawImage(faceBrush.image, 0, 0);
  const finishPixels = finishContext.getImageData(0, 0, 1024, 1024);
  for (let i = 0; i < finishPixels.data.length; i += 4) {
    const value = THREE.MathUtils.clamp(244 + (finishPixels.data[i] - 184) * .8, 224, 255);
    finishPixels.data[i] = finishPixels.data[i + 1] = finishPixels.data[i + 2] = value;
  }
  finishContext.putImageData(finishPixels, 0, 0);
  const finishMap = new THREE.CanvasTexture(finishCanvas);
  finishMap.colorSpace = THREE.SRGBColorSpace;
  finishMap.anisotropy = faceBrush.anisotropy;

  const metal = (color, face = false) => new THREE.MeshPhysicalMaterial({
    color, metalness: 1,
    roughness: 0.32,
    map: face ? finishMap : null,
    roughnessMap: face ? faceBrush : edgeBrush,
    bumpMap: face ? faceBrush : edgeBrush,
    bumpScale: face ? 0.0035 : 0.0002,
  });
  const silverMat = metal(CFG.silver);
  const redMat = metal(CFG.red);
  const silverLipMat = silverMat.clone();
  silverLipMat.roughness = 0.48;
  const redLipMat = redMat.clone();
  redLipMat.roughness = 0.43;
  const silverFaceMat = metal(CFG.silver, true);
  const redFaceMat = metal(CFG.red, true);
  const leafMat = new THREE.MeshPhysicalMaterial({
    color: 0xc80018, metalness: 1, roughness: 0.48,
    map: finishMap, roughnessMap: faceBrush, bumpMap: faceBrush, bumpScale: 0.0015,
  });
  const grooveMat = new THREE.MeshStandardMaterial({ color: 0x290005, metalness: 1, roughness: 0.65 });

  // A shallow stamped leaf with a real bevel catches the light on either side of the coin.
  // Outline: the approved CADD maple leaf (tetra-coin-mark.svg, 198×198 artboard), unchanged.
  const LEAF_PATH = 'M98.9802 38.8867C99.3958 38.8868 99.7124 39.1638 99.7917 39.5596C100.267 42.193 101.02 44.9064 101.911 47.5596C105.732 58.8452 117.572 65.3395 129.215 62.7656C129.947 62.5874 130.501 63.3791 130.105 64.0127C127.65 67.8936 112.167 87.9714 118.225 93.8916C124.541 100.069 143.411 81.0418 146.262 77.7148C146.658 77.2595 147.431 77.3381 147.669 77.9121C150.183 84.1689 160.399 83.9313 167.943 80.209H167.924C168.696 79.8131 169.487 80.7435 168.953 81.4365C162.736 89.6931 150.104 108.959 163.528 113.711C163.528 113.711 135.907 116.978 135.907 125.71C135.907 133.372 149.567 134.6 148.896 136.263C148.718 136.698 148.222 136.876 147.787 136.698C136.006 131.808 120.087 142.262 105.553 127.888C104.294 126.642 102.77 125.828 101.165 125.443L104.999 159.569H93.0007L96.8152 125.438C95.2022 125.821 93.6703 126.637 92.406 127.888C77.8729 142.262 61.9535 131.788 50.1726 136.698C49.7371 136.876 49.2424 136.698 49.0642 136.263C48.3933 134.6 62.0532 133.372 62.0535 125.71C62.0535 118.661 43.9962 115.156 37.0857 114.087C36.3531 113.968 36.1347 112.998 36.7683 112.582C46.2129 106.464 34.8278 89.1585 29.0066 81.4365C28.4726 80.7436 29.245 79.8131 30.0369 80.209C37.5608 83.9313 47.7772 84.1491 50.2917 77.9121C50.5295 77.3382 51.3021 77.2397 51.698 77.7148C54.5303 81.0421 73.4177 100.068 79.7341 93.8916C85.7929 87.9912 70.3094 67.8935 67.8542 64.0127C67.4586 63.3989 68.0332 62.6072 68.7458 62.7656C80.388 65.3394 92.228 58.8452 96.0496 47.5596C96.9406 44.9064 97.6935 42.193 98.1687 39.5596C98.248 39.1638 98.5646 38.8867 98.9802 38.8867Z';
  // Sized to the previous stamp: ~1.25 wide, centred on the coin face (SVG y points down).
  const LEAF_BOX = { x: 28.83, y: 38.89, w: 140.30, h: 120.68 };
  const LEAF_SCALE = 1.25 / LEAF_BOX.w;
  const leafPoint = (x, y) => new THREE.Vector2(
    (x - LEAF_BOX.x - LEAF_BOX.w / 2) * LEAF_SCALE,
    -(y - LEAF_BOX.y - LEAF_BOX.h / 2) * LEAF_SCALE,
  );
  // The path only uses absolute M, C, L, H and Z.
  const leafShape = new THREE.Shape();
  {
    const tok = LEAF_PATH.match(/[MCLHZ]|-?\d*\.?\d+/g);
    let i = 0, cmd = '', x = 0, y = 0;
    const n = () => parseFloat(tok[i++]);
    while (i < tok.length) {
      if (/[MCLHZ]/.test(tok[i])) cmd = tok[i++];
      if (cmd === 'M') { x = n(); y = n(); const p = leafPoint(x, y); leafShape.moveTo(p.x, p.y); cmd = 'L'; }
      else if (cmd === 'L') { x = n(); y = n(); const p = leafPoint(x, y); leafShape.lineTo(p.x, p.y); }
      else if (cmd === 'H') { x = n(); const p = leafPoint(x, y); leafShape.lineTo(p.x, p.y); }
      else if (cmd === 'C') {
        const a = leafPoint(n(), n()), b = leafPoint(n(), n());
        x = n(); y = n(); const c = leafPoint(x, y);
        leafShape.bezierCurveTo(a.x, a.y, b.x, b.y, c.x, c.y);
      } else if (cmd === 'Z') { leafShape.closePath(); }
    }
  }
  let leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.006, bevelEnabled: true, bevelSegments: 3,
    steps: 1, bevelSize: 0.009, bevelThickness: 0.006,
  });
  let leafGrooveGeo = new THREE.ShapeGeometry(leafShape);
  leafGrooveGeo.scale(1.025, 1.025, 1);
  const tessellate = new TessellateModifier(0.10, 6);
  function crownStamp(geometry) {
    geometry = tessellate.modify(geometry);
    const positions = geometry.attributes.position, normals = geometry.attributes.normal;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), crown = -0.055, radius = 0.868;
      positions.setZ(i, positions.getZ(i) + crown * (1 - (x * x + y * y) / radius ** 2));
      const n = new THREE.Vector3(normals.getX(i) + 2 * crown * x / radius ** 2 * normals.getZ(i), normals.getY(i) + 2 * crown * y / radius ** 2 * normals.getZ(i), normals.getZ(i)).normalize();
      normals.setXYZ(i, n.x, n.y, n.z);
    }
    return geometry;
  }
  leafGeo = crownStamp(leafGeo);
  leafGrooveGeo = crownStamp(leafGrooveGeo);
  // Radial subdivisions form a shallow pressed dish and bend the studio reflections.
  function faceGeometry(crown) {
    const positions = [], uvs = [], indices = [];
    const rings = 20, segments = 160, radius = 0.868;
    for (let j = 0; j <= rings; j++) {
      const r = radius * j / rings;
      for (let i = 0; i <= segments; i++) {
        const a = i / segments * Math.PI * 2;
        const x = r * Math.cos(a), y = r * Math.sin(a);
        positions.push(x, y, crown * (1 - (r / radius) ** 2));
        uvs.push(x / (2 * radius) + .5, y / (2 * radius) + .5);
        if (j < rings && i < segments) {
          const k = j * (segments + 1) + i;
          indices.push(k, k + segments + 1, k + 1, k + 1, k + segments + 1, k + segments + 2);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    // Analytic normals keep the centre and the UV seam smooth.
    const normals = [];
    for (let i = 0; i < positions.length; i += 3) {
      const n = new THREE.Vector3(2 * crown * positions[i] / radius ** 2, 2 * crown * positions[i + 1] / radius ** 2, 1).normalize();
      normals.push(n.x, n.y, n.z);
    }
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    return geometry;
  }
  const faceGeo = faceGeometry(-0.055);
  const silverFaceGeo = faceGeometry(-0.065);
  const rivetGeo = new THREE.SphereGeometry(0.022, 16, 12);

  // Shared container; each coin turns independently at its own fixed centre.
  const chain = new THREE.Group();
  scene.add(chain);

  function makeCoin(isRed) {
    const coin = new THREE.Group();
    coin.add(new THREE.Mesh(bodyGeo, isRed ? [redMat, redLipMat] : [silverMat, silverLipMat]));
    for (const side of [1, -1]) {
      // Circle UVs keep straight brushing across the entire face, without a radial pole.
      const face = new THREE.Mesh(isRed ? faceGeo : silverFaceGeo, isRed ? redFaceMat : silverFaceMat);
      face.rotation.x = -side * Math.PI / 2;
      face.position.y = side * (T + 0.001);
      coin.add(face);
      if (isRed) {
        const stamp = new THREE.Group();
        stamp.rotation.x = -side * Math.PI / 2;
        stamp.position.y = side * (T + 0.003);
        const groove = new THREE.Mesh(leafGrooveGeo, grooveMat);
        stamp.add(groove);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.z = 0.007;
        stamp.add(leaf);
        coin.add(stamp);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          const rivet = new THREE.Mesh(rivetGeo, redMat);
          rivet.position.set(Math.cos(a) * 0.84, T * side, Math.sin(a) * 0.84);
          coin.add(rivet);
        }
      }
    }
    const pivot = new THREE.Group(); // centre and roll of this coin in the wave
    pivot.add(coin);
    chain.add(pivot);
    return { pivot, coin };
  }

  let coins = [];
  let halfW = 4.85;
  const modulo = (value, length) => ((value % length) + length) % length;

  function layout() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    halfW = 4.85;
    const halfH = halfW * h / w;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    const n = Math.ceil((halfW * 2 + 4) / CFG.spacing);
    if (n !== coins.length) {
      coins.forEach(c => chain.remove(c.pivot));
      coins = Array.from({ length: n }, (_, i) => makeCoin(i === 0));
    }
  }

  // Reference poses along the chain: reverse face → edge → front face.
  // Smooth interpolation preserves one flowing twist instead of independent random tilts.
  const poses = [
    [-6.5, 2.40, 1.00], [-3.9, 2.40, .85], [-2.6, 2.08, .67],
    [-1.3, 1.27, .47], [0, 1.18, .52], [1.3, .90, .67],
    [2.6, .87, 1.15], [3.9, .86, 1.15], [6.5, .95, 1.05],
  ];
  function poseAt(x) {
    const end = poses.findIndex(p => p[0] > x);
    if (end < 1) return poses[end === 0 ? 0 : poses.length - 1].slice(1);
    const a = poses[end - 1], b = poses[end];
    const u = THREE.MathUtils.clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
    const blend = u * u * (3 - 2 * u);
    return [THREE.MathUtils.lerp(a[1], b[1], blend), THREE.MathUtils.lerp(a[2], b[2], blend)];
  }

  function place(t) {
    const span = coins.length * CFG.spacing;
    coins.forEach(({ pivot, coin }, i) => {
      // Start: the red coin (i = 0) sits second from the left edge, then drifts right.
      const x = modulo(CFG.redStart + i * CFG.spacing + t * CFG.drift + span / 2, span) - span / 2;
      const y = 0.04 * x + 0.07 - 0.08 * Math.exp(-((x / .65) ** 2));
      pivot.position.set(x, y, x * CFG.depthStep / CFG.spacing);
      // One coordinated wave replaces competing rotations around unrelated axes.
      // Every coin still turns through both faces, slowly, about a diameter.
      const [inclination, roll] = poseAt(x);
      const flip = inclination + t * Math.PI * 2 / CFG.turnPeriod;
      pivot.rotation.set(0, 0, -roll);
      coin.rotation.set(-Math.PI / 2 - flip, 0, 0);
      coin.rotateY(-0.91); // orient the leaf and the brushing within the coin face
    });
    renderer.render(scene, camera);
  }

  layout();
  new ResizeObserver(layout).observe(el);

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(el);

  const frozen = new URLSearchParams(location.search).get('t'); // ?t=2.5 shows a single still frame (for checking)
  const t0 = performance.now();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    place(frozen !== null ? +frozen : still ? 0 : (performance.now() - t0) / 1000);
  });
})();
