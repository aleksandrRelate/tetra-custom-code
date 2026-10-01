// One flat SVG travels from the hero into the introduction and final grid.
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const ramp = (p, a, b) => ease((p - a) / (b - a));
const mix = (a, b, t) => a + (b - a) * t;

async function mount(root) {
  const stage = root.querySelector('.cadd-scene__stage');
  const title = root.querySelector('.cadd-scene__title');
  const copy = root.querySelector('.cadd-scene__copy');
  const destination = copy.querySelector('.cadd-scene__destination');
  const remainder = copy.querySelector('.cadd-scene__remainder');
  const originalRemainder = remainder.innerHTML;
  const titleWords = [title.firstElementChild, title.lastElementChild];
  const destinationWords = [destination.firstElementChild, destination.lastElementChild];
  const mark = root.querySelector('.cadd-scene__mark');
  const grid = root.querySelector('.cadd-scene__grid');
  const hero = document.querySelector('#section-hero');
  const heroMark = hero?.querySelector('.cadd-logo');
  const navbar = document.querySelector('.navbar-wrapper');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const disabled = (new URLSearchParams(location.search).get('perf') || '').split(',').some(x => ['all', 'coin'].includes(x.trim()));
  const face = new Image();
  // The flat mark's light outline would read as a white seam on the 3D edge; drop it for the faces only.
  const svg = (await (await fetch(mark.src)).text()).replace(/ stroke="#E5E5E5" stroke-width="[^"]*"/i, '');
  face.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await face.decode();
  // Two faces and short side panels form a round CSS coin.
  // No spaced SVG layers: the edge stays solid when viewed side-on.
  const coin = document.createElement('div');
  coin.className = 'cadd-scene__moving-coin'; coin.setAttribute('aria-hidden', 'true');
  const frontFace = face.cloneNode(), backFace = face.cloneNode();
  frontFace.alt = backFace.alt = '';
  frontFace.className = 'cadd-coin__face cadd-coin__face--front';
  backFace.className = 'cadd-coin__face cadd-coin__face--back';
  const SEGMENTS = 48, BEVEL_STEPS = 3;
  const outline = Array.from({ length: SEGMENTS }, (_, i) => -Math.PI / 2 + i * 2 * Math.PI / SEGMENTS);
  // Edge profile from the front face to the back: a quarter-round bevel, the side, another bevel.
  // Each band is a ring of flat planes; colour stays close to the side so the steps don't read as stripes.
  const BANDS = 2 * BEVEL_STEPS + 1;
  const walls = Array.from({ length: BANDS }, (_, band) => outline.map(() => {
    const wall = document.createElement('div'); wall.className = 'cadd-coin__wall';
    const bevel = band < BEVEL_STEPS ? band : band > BEVEL_STEPS ? BANDS - 1 - band : BEVEL_STEPS;
    wall.style.background = `color-mix(in srgb, #941216 ${100 - 8 * (BEVEL_STEPS - bevel) / BEVEL_STEPS}%, #ce191d)`;
    coin.append(wall); return wall;
  }));
  coin.append(backFace, frontFace);
  const castShadow = face.cloneNode();
  castShadow.alt = ''; castShadow.className = 'cadd-coin__cast-shadow';
  castShadow.setAttribute('aria-hidden', 'true');
  document.body.append(castShadow, coin);
  // A fixed text layer avoids inheriting the entering section's scroll motion.
  // Its vertical position changes only during the intentional flight to copy.
  const rootStyle = getComputedStyle(root);
  title.style.fontFamily = rootStyle.fontFamily;
  title.style.setProperty('--coin-ink', rootStyle.getPropertyValue('--coin-ink'));
  title.style.setProperty('--coin-muted', rootStyle.getPropertyValue('--coin-muted'));
  title.style.opacity = '0';
  title.classList.add('is-viewport-title');
  document.body.append(title);
  // Same word-by-word muted → ink fill as the site's original intro.
  // Keep text and explicit line breaks intact without requiring SplitText.
  const walker = document.createTreeWalker(remainder, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(text => {
      if (/\S/.test(text)) { const word = document.createElement('span'); word.className = 'cadd-scene__fill-word'; word.textContent = text; fragment.append(word); }
      else fragment.append(document.createTextNode(text));
    });
    node.replaceWith(fragment);
  });
  // Introducing CADD docks already in ink; only the rest of the paragraph fills.
  const fillWords = [...remainder.querySelectorAll('.cadd-scene__fill-word')];
  let frame = 0, visible = true, destroyed = false;
  function textRect(element) { const range = document.createRange(); range.selectNodeContents(element); return range.getBoundingClientRect(); }
  function draw() {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    const still = reduced.matches || disabled;
    const rect = root.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const p = still ? 1 : clamp(-rect.top / Math.max(1, root.offsetHeight - height));
    const mobile = width <= 479;
    // Keep the copy below the whole navigation, including its announcement bar.
    const navBottom = navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0;
    // On mobile the whole scene sits ~2.5rem higher.
    const lift = mobile ? 40 : 0;
    copy.style.top = `${Math.max(mobile ? 150 - lift : 180, navBottom + 32 - lift)}px`;
    // Storyboard (Figma "3d scene v2"):
    // words at the edges → close in while the coin grows between them
    // → first flip: CADD joins Introducing, both fly into the complete grey copy
    // → second flip: the coin lands in the grid while the words fill with ink.
    // Start the words during the latter part of the hero descent.
    const heroLinked = heroMark && rect.top > 0 && !still;
    const heroRect = heroLinked ? hero.getBoundingClientRect() : null;
    const fallRaw = heroLinked ? clamp(-heroRect.top / Math.max(1, rect.top - heroRect.top)) : 1;
    const textProgress = heroLinked ? fallRaw - 1 : p;
    const appear = ramp(textProgress, -.32, -.04);
    const close = ramp(textProgress, -.18, .18);
    const hop = ramp(p, .26, .64);
    const join = ramp(p, .27, .43);
    const flight = ramp(p, .36, .62);
    const land = ramp(p, .66, .96);
    const target = mark.getBoundingClientRect();
    const ratio = 1;
    const large = Math.min(width * (mobile ? .16 : .14), height * .225);
    const hopped = Math.min(width * (mobile ? .2 : .19), height * .3);
    const centerX = stageRect.left + width / 2, centerY = stageRect.top + height / 2;
    // Words and coin share the viewport centre while the scene is still sliding in,
    // then follow the stage once it scrolls away.
    const anchorY = Math.min(centerY, height / 2) - lift;

    title.style.fontSize = '';
    const initialFont = parseFloat(getComputedStyle(title).fontSize);
    title.style.fontSize = `${mix(initialFont, parseFloat(getComputedStyle(copy).fontSize), flight)}px`;
    title.style.color = 'var(--coin-ink)';
    titleWords.forEach(word => { word.style.transform = ''; });
    const [introSource, caddSource] = titleWords.map(textRect);
    const [introEnd, caddEnd] = destinationWords.map(textRect);
    const edge = mobile ? 16 : Math.max(24, width * .064);

    // Growth completes during the descent; the words arrive around its final size.
    const grownSize = large;
    const gap = mobile ? 12 : grownSize * ratio * .47;
    // Centred on the coin, unless Introducing would cross the edge (narrow screens).
    const introBeside = Math.max(stageRect.left + edge, centerX - grownSize * ratio / 2 - gap - introSource.width);
    let grownX = centerX;
    const caddBeside = grownX + grownSize * ratio / 2 + gap;
    // Words spread by the same distance on both sides, so the coin stays centred
    // between them; the widest spread still keeps both words on screen.
    const spreadMax = Math.max(0, Math.min(introBeside - stageRect.left - edge, stageRect.right - edge - caddBeside - caddSource.width));
    const spread = spreadMax * (1 - close);
    // Mobile: no spread/join step — "Introducing CADD" sits joined at the left edge.
    const introStartX = mobile ? stageRect.left + edge : introBeside - spread;
    // CADD slides onto Introducing; the coin hops over it to the far side.
    // Joined spacing at the starting font size: flight interpolates from here to the
    // paragraph, so the words keep their natural space while the font shrinks.
    const startRatio = initialFont / parseFloat(getComputedStyle(copy).fontSize);
    const joinedCaddX = introStartX + (caddEnd.left - introEnd.left) * startRatio;
    const caddStartX = mobile ? joinedCaddX : caddBeside + spread;
    const settledSize = grownSize * .78;
    const hopSize = mix(grownSize, settledSize, hop);
    const originalHopX = Math.min(joinedCaddX + caddSource.width + gap + hopped * ratio / 2, stageRect.right - edge - hopped * ratio / 2);
    const hopX = Math.min(originalHopX + width * .15, stageRect.right - edge - hopped * ratio / 2);

    // Mobile: the coin sits at the right edge beside the joined words, grows with the scroll
    // into the free space, then flips while the heading flies into the paragraph.
    const freeSpace = stageRect.right - edge - (joinedCaddX + caddSource.width) - 2 * gap;
    const mobileBig = Math.max(settledSize, Math.min(freeSpace, width * .36));
    const mobileSize = mix(settledSize, mobileBig, ramp(p, 0, .36));
    const sideX = stageRect.right - edge - mobileSize * ratio / 2;
    if (mobile) grownX = stageRect.right - edge - settledSize * ratio / 2;
    const turn = mobile ? flight : hop;
    let size = mobile ? mobileSize : hopSize, x = mobile ? sideX : mix(grownX, hopX, hop), y = anchorY;
    // One half-turn per move: a single edge-on moment spread across the whole phase.
    let spin = 180 * turn, tilt = Math.sin(turn * Math.PI);
    let roll = 12 * turn; // clockwise, retained after the first flip
    if (land > 0) {
      size = mix(mobile ? mobileBig : settledSize, target.height, land);
      x = mix(mobile ? sideX : hopX, target.left + target.width / 2, land);
      y = mix(anchorY, target.top + target.height / 2, land) - Math.sin(land * Math.PI) * height * .08;
      spin = 180 + 180 * land;
      tilt = Math.sin(land * Math.PI);
      roll = mix(12, 0, land) + 4 * Math.sin(land * Math.PI);
    }
    if (heroLinked) {
      // Land straight into the growing state between the words, so nothing jumps when the scene sticks.
      const source = heroMark.getBoundingClientRect();
      // Reach the centre exactly as the second section settles into place.
      const fall = ease(fallRaw);
      x = mix(source.left + source.width / 2, grownX, fall);
      y = mix(source.top - heroRect.top + source.height / 2, anchorY, fall) + Math.sin(fall * Math.PI) * height * .20;
      // Scale tracks the scroll directly, without the path's easing.
      size = mix(source.height, mobile ? settledSize : grownSize, fallRaw);
      spin = 0; tilt = 0; roll = 0;
    }
    coin.style.width = `${size * ratio}px`;
    coin.style.height = `${size}px`;
    // Flat SVG flipped in CSS 3D; the mark is symmetric, so the back face reads the same.
    // A close perspective and a slight axis tilt mid-flip make the turn read as depth.
    const depth = size * .077;
    coin.style.setProperty('--coin-depth', `${depth}px`);
    // The bevel grows outward from the face edge only while the coin is turned,
    // so a face-on coin still matches the flat mark exactly.
    const half = size / 2, bevel = depth * .45 * Math.abs(Math.sin(spin * Math.PI / 180));
    const profile = [];
    for (let k = 0; k <= BEVEL_STEPS; k++) { const t = k / BEVEL_STEPS * Math.PI / 2; profile.push([half + bevel * Math.sin(t), depth / 2 - bevel + bevel * Math.cos(t)]); }
    for (let k = BEVEL_STEPS; k >= 0; k--) { const t = k / BEVEL_STEPS * Math.PI / 2; profile.push([half + bevel * Math.sin(t), -depth / 2 + bevel - bevel * Math.cos(t)]); }
    // Subpixel overlap seals rasterized joins between adjacent CSS planes.
    const overlap = .4, step = 2 * Math.PI / SEGMENTS;
    walls.forEach((ring, band) => {
      const [r1, z1] = profile[band + 1], [r2, z2] = profile[band];
      const height = Math.hypot(r2 - r1, z2 - z1), tiltBand = Math.atan2(z2 - z1, -(r2 - r1));
      const length = 2 * Math.max(r1, r2) * Math.sin(step / 2);
      ring.forEach((wall, i) => {
        const a = outline[i], chord = a + step / 2 + Math.PI / 2;
        wall.style.width = `${length + 2 * overlap}px`;
        wall.style.height = `${height + 2 * overlap}px`;
        wall.style.transform = `translate3d(${half + r1 * Math.cos(a) - Math.cos(chord) * overlap}px,${half + r1 * Math.sin(a) - Math.sin(chord) * overlap}px,${z1}px) rotateZ(${chord}rad) rotateX(${tiltBand}rad) translateY(${-overlap}px)`;
      });
    });
    coin.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) perspective(${size * 2.2}px) rotateX(${-14 * tilt}deg) rotateZ(${roll}deg) rotateY(${spin}deg)`;
    // Faces catch less light as they turn away; continuous side walls stay darker.
    const light = .62 + .38 * Math.abs(Math.cos(spin * Math.PI / 180));
    frontFace.style.filter = backFace.style.filter = `brightness(${light})`;
    // Separate shadow layer: the solid CSS side walls cannot hide it.
    // Dissolve early in the second flip so the enlarged shadow does not linger.
    const shadow = ramp(p, .56, .64) * (1 - ramp(p, .66, .84));
    castShadow.style.width = `${size * ratio}px`;
    castShadow.style.height = `${size}px`;
    castShadow.style.transform = `translate(${x+5}px, ${y+9}px) translate(-50%, -50%) rotate(${roll}deg)`;
    castShadow.style.opacity = String(.20 * shadow);
    // Keep the same SVG fully opaque through landing; no crossfade or swap.
    coin.style.opacity = '1';
    coin.style.visibility = still || rect.bottom < 0 ? 'hidden' : 'visible';
    castShadow.style.visibility = coin.style.visibility;
    heroMark?.classList.toggle('cadd-coin-taken', !still);

    const introX = mix(introStartX, introEnd.left, flight);
    // Blend joining into the shared flight; never snap CADD to a new anchor.
    const caddX = mix(mix(caddStartX, joinedCaddX, mobile ? 1 : join), caddEnd.left, flight);
    const titleAnchorY = height / 2 - lift;
    const startY = titleAnchorY - introSource.height / 2;
    titleWords[0].style.transform = `translate(${introX-introSource.left}px, ${mix(startY,introEnd.top,flight)-introSource.top}px)`;
    titleWords[1].style.transform = `translate(${caddX-caddSource.left}px, ${mix(startY,caddEnd.top,flight)-caddSource.top}px)`;
    title.style.opacity = p < .62 ? String(appear) : '0';
    destination.style.opacity = p < .62 ? '0' : '1';
    // Reveal the rest only after the moving heading has docked in the paragraph.
    remainder.style.opacity = flight < 1 ? '0' : String(ramp(p, .62, .65));
    copy.style.opacity = '1';
    const fill = land * fillWords.length;
    fillWords.forEach((word, i) => {
      word.style.color = `color-mix(in srgb, var(--coin-ink) ${100*clamp(fill-i)}%, var(--coin-muted))`;
    });
    grid.style.opacity = String(ramp(p, .66, .94));
    mark.style.opacity = still ? '1' : '0';
    root.classList.toggle('is-shimmering', p > .96 && !still);
    root.dataset.progress = p.toFixed(3);
  }
  function requestDraw() { if (!frame && !destroyed) frame = requestAnimationFrame(draw); }
  function motion() { root.classList.toggle('is-static', reduced.matches || disabled); requestDraw(); }
  root.classList.add('is-ready'); motion();
  const observer = new ResizeObserver(requestDraw); observer.observe(stage); if (navbar) observer.observe(navbar);
  const intersections = new Map();
  const intersection = new IntersectionObserver(entries => {
    entries.forEach(e => intersections.set(e.target,e.isIntersecting));
    visible = [...intersections.values()].some(Boolean);
    coin.style.visibility = visible ? 'visible' : 'hidden';
    castShadow.style.visibility = coin.style.visibility;
    title.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) root.classList.remove('is-shimmering');
    if (visible) requestDraw();
  }, {rootMargin:'150px'});
  intersection.observe(root); if (heroMark) intersection.observe(hero);
  function visibilityChanged() { if (document.hidden) root.classList.remove('is-shimmering'); requestDraw(); }
  window.addEventListener('scroll',requestDraw,{passive:true}); window.addEventListener('resize',requestDraw);
  document.addEventListener('visibilitychange',visibilityChanged); reduced.addEventListener('change',motion);
  document.fonts.ready.then(requestDraw);
  root.caddSceneDestroy = () => {
    destroyed=true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
    window.removeEventListener('scroll',requestDraw); window.removeEventListener('resize',requestDraw);
    document.removeEventListener('visibilitychange',visibilityChanged); reduced.removeEventListener('change',motion);
    coin.remove(); castShadow.remove(); heroMark?.classList.remove('cadd-coin-taken');
    title.classList.remove('is-viewport-title'); title.style.removeProperty('visibility'); stage.append(title);
    root.classList.remove('is-ready','is-static','is-shimmering'); remainder.innerHTML=originalRemainder;
    destinationWords.forEach(word => word.style.removeProperty('color'));
  };
}
document.querySelectorAll('[data-cadd-scene]').forEach(root => mount(root).catch(error => { root.classList.remove('is-ready'); console.warn('CADD scene could not initialize.',error); }));
