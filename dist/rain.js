// A small, opt-in shower. Particle positions use page coordinates so scrolling
// never makes falling water follow the viewport.
const MAX_DROPS = 48;
export function advanceDrop(drop, seconds) {
  const dt = Math.max(0, Math.min(seconds, 1 / 30));
  return { ...drop, x: drop.x + drop.vx * dt,
    y: drop.y + drop.vy * dt + 140 * dt * dt,
    vy: Math.min(440, drop.vy + 280 * dt) };
}

export function initCloudRain({ isPaused, isQuiet, isTransitioning }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'cloud-rain';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const frame = document.querySelector('.frame');
  const landscape = document.querySelector('.moon-landscape');
  const clouds = [...document.querySelectorAll('[data-rain-cloud]')].map(button => ({
    button, image: button.querySelector('img'), active: false,
    drops: [], splashes: [], carry: 0,
  }));
  let raf = 0, last = 0, width = 0, height = 0;
  const daylight = () => document.documentElement.dataset.theme === 'light';
  const still = () => isPaused() || isQuiet();

  function label(cloud) {
    cloud.button.setAttribute('aria-pressed', String(cloud.active));
    cloud.button.setAttribute('aria-label', `${cloud.active ? 'Stop' : 'Start'} rain from the ${cloud.button.dataset.rainCloud} cloud`);
    cloud.button.title = cloud.active ? 'A little sunshine? Click to stop.' : 'A little rain? Click me.';
  }
  function area(cloud) {
    const r = cloud.image.getBoundingClientRect();
    const sky = cloud.button.dataset.rainCloud === 'sky';
    const clip = sky
      ? { left: 0, right: Math.max(0, frame.getBoundingClientRect().left + 9), top: 0, bottom: height }
      : landscape.getBoundingClientRect();
    // The tiny mobile sky cloud sits above the greeting. Its shower stays in
    // that empty strip; the footer cloud has room for the full little shower.
    if (sky && width < 768) { clip.right = Math.min(176, width); clip.bottom = 82 - scrollY; }
    const left = Math.max(0, clip.left, r.left + r.width * .10);
    const right = Math.min(width, clip.right, r.right - r.width * .08);
    const origin = r.top + r.height * .73;
    const floor = Math.min(clip.bottom - 8, origin + (sky ? 240 : 135));
    return { left, right, origin, floor, clip, visible: right - left > 4 && floor > origin && r.bottom > 0 && r.top < height };
  }
  function reset(cloud) {
    cloud.drops.length = cloud.splashes.length = 0;
    cloud.carry = 0;
  }
  function drawDrop(x, y, alpha, length = 7) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#6c9fb5';
    ctx.fillRect(Math.round(x), Math.round(y), 2, length);
    ctx.fillStyle = '#bdd8de';
    ctx.fillRect(Math.round(x), Math.round(y), 1, Math.max(2, length - 2));
  }
  function draw(cloud, region, dt, frozen) {
    const { clip, left, right, origin, floor } = region;
    ctx.save();
    ctx.beginPath();
    ctx.rect(clip.left, clip.top, Math.max(0, clip.right - clip.left), Math.max(0, clip.bottom - clip.top));
    ctx.clip();
    if (frozen) {
      // Deliberately static feedback for motion preferences and the pause button.
      for (let i = 0; i < 10; i++) {
        const x = left + ((i * .618) % 1) * (right - left);
        const y = origin + 7 + ((i * .381) % 1) * Math.max(0, Math.min(80, floor - origin - 12));
        drawDrop(x, y, .4, 5);
      }
      ctx.restore();
      return;
    }
    cloud.carry = Math.min(2, cloud.carry + dt * 23);
    while (cloud.carry >= 1 && cloud.drops.length < MAX_DROPS) {
      cloud.carry--;
      cloud.drops.push({ x: left + Math.random() * (right - left) + scrollX,
        y: origin + scrollY, vx: -7 - Math.random() * 8,
        vy: 95 + Math.random() * 85, floor: floor + scrollY,
        alpha: .35 + Math.random() * .4, length: 5 + Math.floor(Math.random() * 5) });
    }
    for (let i = cloud.drops.length - 1; i >= 0; i--) {
      const drop = cloud.drops[i] = advanceDrop(cloud.drops[i], dt);
      if (drop.y >= drop.floor) {
        if (cloud.splashes.length < 14) cloud.splashes.push({ x: drop.x, y: drop.floor, age: 0 });
        cloud.drops.splice(i, 1);
      } else drawDrop(drop.x - scrollX, drop.y - scrollY, drop.alpha, drop.length);
    }
    for (let i = cloud.splashes.length - 1; i >= 0; i--) {
      const splash = cloud.splashes[i];
      splash.age += dt;
      if (splash.age > .22) { cloud.splashes.splice(i, 1); continue; }
      const spread = 2 + splash.age * 18;
      ctx.globalAlpha = (1 - splash.age / .22) * .4;
      ctx.fillStyle = '#78a4b1';
      ctx.fillRect(Math.round(splash.x - scrollX - spread), Math.round(splash.y - scrollY - 2), 2, 2);
      ctx.fillRect(Math.round(splash.x - scrollX + spread), Math.round(splash.y - scrollY - 2), 2, 2);
    }
    ctx.restore();
  }
  function paint(now) {
    raf = 0;
    ctx?.clearRect(0, 0, width, height);
    if (!ctx || !daylight() || document.hidden || isTransitioning()) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    let visible = false;
    for (const cloud of clouds) {
      if (!cloud.active) continue;
      const region = area(cloud);
      if (!region.visible) { reset(cloud); continue; }
      visible = true;
      draw(cloud, region, dt, still());
    }
    if (visible && !still()) raf = requestAnimationFrame(paint);
    else last = 0;
  }
  function sync() {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    for (const cloud of clouds) {
      reset(cloud);
      if (!daylight()) { cloud.active = false; label(cloud); }
    }
    paint(performance.now());
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    sync();
  }
  for (const cloud of clouds) {
    label(cloud);
    cloud.button.addEventListener('click', () => {
      if (!daylight() || isTransitioning()) return;
      cloud.active = !cloud.active;
      label(cloud);
      sync();
    });
    cloud.image.addEventListener('load', sync);
  }
  // Scroll only wakes an idle shower; active drops stay in page coordinates.
  addEventListener('scroll', () => { if (!raf) paint(performance.now()); }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  resize();
  return { sync };
}
