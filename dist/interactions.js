/** Decorative cursor gravity. Never moves a click target or the astronaut's feet. */
export function initCursorUniverse({ isPaused }) {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const canvas = document.createElement("canvas");
  canvas.className = "cursor-constellation";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  const frame = document.querySelector(".frame");
  const landscape = document.querySelector(".moon-landscape");
  const pointer = { x: 0, y: 0, active: false };
  const particles = [];
  const bodies = [...document.querySelectorAll(
    ".galaxy, .space-object, .footer-space-art img, .moon-scene, .earth-scene, .nature-art img, .footer-nature-art img, .rain-cloud img, .earth img, .bit, .sky i, .landscape-stars span",
  )].map((el) => {
    const star = el.matches(".sky i, .landscape-stars span");
    const moon = el.matches(".moon-scene, .earth-scene");
    const mascot = el.matches(".bit");
    el.classList.add("cursor-body");
    return { el, star, moon, mascot, x: 0, y: 0, angle: 0, glow: 0, vx: 0, vy: 0, va: 0 };
  });
  let raf = 0, last = 0, dirty = true, hovered = null;
  let frameRect, landscapeRect, width = 0, height = 0;
  let lastParticle = { x: 0, y: 0, time: 0 };

  const enabled = () => finePointer.matches && !isPaused() && !document.hidden;
  function measure() {
    frameRect = frame.getBoundingClientRect();
    landscapeRect = landscape.getBoundingClientRect();
    for (const b of bodies) {
      const r = b.el.getBoundingClientRect();
      // Remove our translation so the resting center cannot chase itself.
      b.cx = r.left + r.width / 2 - b.x;
      b.cy = r.top + r.height / 2 - b.y;
      b.radius = b.star ? 115 : b.mascot ? 100 : Math.max(120, Math.min(230, r.width * 0.7));
      b.visible = r.width > 0 && r.height > 0 && r.bottom > -30 && r.top < height + 30 && r.right > -30 && r.left < width + 30;
    }
    dirty = false;
  }
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    invalidate();
  }
  function clearHover() {
    if (!hovered) return;
    hovered.classList.remove("cursor-lit");
    ["--light-x", "--light-y", "--icon-x", "--icon-y"].forEach((p) => hovered.style.removeProperty(p));
    hovered = null;
  }
  function write(b) {
    const values = [ `${b.x.toFixed(2)}px`, `${b.y.toFixed(2)}px`, `${b.angle.toFixed(2)}deg`, b.glow.toFixed(3) ];
    ["--cursor-x", "--cursor-y", "--cursor-angle", "--cursor-glow"].forEach((property, i) => {
      if (b.written?.[i] !== values[i]) b.el.style.setProperty(property, values[i]);
    });
    b.written = values;
  }
  function wake() {
    if (!raf && enabled()) raf = requestAnimationFrame(tick);
  }
  function invalidate() {
    dirty = true;
    wake();
  }
  function leave() {
    pointer.active = false;
    clearHover();
    wake();
  }
  function insideSpace(x, y) {
    return x < frameRect.left || x > frameRect.right || (
      x > landscapeRect.left && x < landscapeRect.right &&
      y > landscapeRect.top && y < landscapeRect.bottom - 45
    );
  }
  function draw(now) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    // Keep constellation light in the sky and moon scene, away from reading text.
    ctx.beginPath();
    ctx.rect(0, 0, Math.max(0, frameRect.left), height);
    ctx.rect(frameRect.right, 0, Math.max(0, width - frameRect.right), height);
    ctx.rect(landscapeRect.left, landscapeRect.top, landscapeRect.width, landscapeRect.height - 45);
    ctx.clip();
    const light = document.documentElement.dataset.theme === "light";
    const color = light ? "91,126,66" : "183,199,255";
    if (!light && pointer.active && insideSpace(pointer.x, pointer.y)) {
      const nearby = bodies.filter((b) => b.star && b.visible)
        .map((b) => ({ x: b.cx + b.x, y: b.cy + b.y,
          distance: Math.hypot(b.cx - pointer.x, b.cy - pointer.y) }))
        .filter((p) => p.distance < 120).sort((a, b) => a.distance - b.distance).slice(0, 5);
      for (let i = 0; i < nearby.length; i++) {
        const p = nearby[i], previous = i ? nearby[i - 1] : pointer;
        ctx.strokeStyle = `rgba(${color},${(1 - p.distance / 120) * 0.3})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${color},0.7)`;
        ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i], age = (now - p.time) / 550;
      if (age >= 1) { particles.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${color},${(1 - age) * 0.55})`;
      const x = Math.round(p.x), y = Math.round(p.y - age * 9);
      if (light) {
        // Small pixel leaves in daylight, stardust at night.
        ctx.fillRect(x, y - 2, 2, 2);
        ctx.fillRect(x - 2, y, 5, 3);
        ctx.fillRect(x - 1, y + 3, 2, 2);
      } else {
        ctx.fillRect(x - 2, y, 5, 1);
        ctx.fillRect(x, y - 2, 1, 5);
      }
    }
    ctx.restore();
  }
  function tick(now) {
    raf = 0;
    if (!enabled()) return;
    const dt = Math.min((now - (last || now - 16.67)) / 1000, 1 / 30);
    last = now;
    if (dirty) measure();
    let moving = false;
    for (const b of bodies) {
      const dx = pointer.x - b.cx, dy = pointer.y - b.cy;
      const distance = Math.hypot(dx, dy);
      const influence = pointer.active && b.visible ? Math.max(0, 1 - distance / b.radius) : 0;
      const reach = b.star ? -12 : b.moon ? 12 : b.mascot ? 12 : 36;
      const tx = dx / b.radius * influence * reach;
      const ty = dy / b.radius * influence * reach;
      // The moon's base transform centers the whole scene: translate it as a unit.
      const ta = b.star || b.mascot || b.moon ? 0 : dx / b.radius * influence * 25;
      // Damped spring, capped timestep: the response stays stable after a slow frame.
      for (const [key, velocity, target] of [["x", "vx", tx], ["y", "vy", ty], ["angle", "va", ta]]) {
        b[velocity] += ((target - b[key]) * 180 - b[velocity] * 21) * dt;
        b[key] += b[velocity] * dt;
        if (Math.abs(target - b[key]) < 0.015 && Math.abs(b[velocity]) < 0.015) {
          b[key] = target; b[velocity] = 0;
        } else moving = true;
      }
      b.glow += (influence - b.glow) * (1 - Math.exp(-12 * dt));
      if (Math.abs(influence - b.glow) < 0.003) b.glow = influence;
      else moving = true;
      write(b);
    }
    draw(now);
    if (moving || particles.length) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    pointer.active = false;
    clearHover();
    particles.length = 0;
    if (!enabled()) {
      pointer.active = false;
      clearHover();
      particles.length = 0;
      ctx?.clearRect(0, 0, width, height);
      for (const b of bodies) {
        b.x = b.y = b.angle = b.glow = b.vx = b.vy = b.va = 0;
        write(b);
      }
    } else invalidate();
  }
  document.addEventListener("pointermove", (event) => {
    if (!enabled() || event.pointerType === "touch") return;
    if (document.querySelector("dialog[open]")) { leave(); return; }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    const target = event.target.closest(".tile, .project-row, .provider");
    if (target !== hovered) { clearHover(); hovered = target; }
    if (hovered) {
      const r = hovered.getBoundingClientRect();
      hovered.classList.add("cursor-lit");
      hovered.style.setProperty("--light-x", `${pointer.x - r.left}px`);
      hovered.style.setProperty("--light-y", `${pointer.y - r.top}px`);
      hovered.style.setProperty("--icon-x", `${((pointer.x - r.left) / r.width - 0.5) * 5}px`);
      hovered.style.setProperty("--icon-y", `${((pointer.y - r.top) / r.height - 0.5) * 5}px`);
    }
    const now = performance.now();
    if (!dirty && insideSpace(pointer.x, pointer.y) && now - lastParticle.time > 45 &&
        Math.hypot(pointer.x - lastParticle.x, pointer.y - lastParticle.y) > 20) {
      lastParticle = { x: pointer.x, y: pointer.y, time: now };
      particles.push(lastParticle);
      if (particles.length > 12) particles.shift();
    }
    wake();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  document.addEventListener("pointercancel", leave);
  document.addEventListener("keydown", () => { leave(); particles.length = 0; });
  addEventListener("blur", leave);
  addEventListener("scroll", () => { leave(); particles.length = 0; invalidate(); }, { passive: true });
  addEventListener("resize", resize, { passive: true });
  document.addEventListener("load", invalidate, true);
  document.addEventListener("visibilitychange", sync);
  finePointer.addEventListener("change", sync);
  new ResizeObserver(invalidate).observe(frame);
  const modalObserver = new MutationObserver(() => { leave(); particles.length = 0; });
  document.querySelectorAll("dialog").forEach((dialog) => modalObserver.observe(dialog, { attributes: true, attributeFilter: ["open"] }));
  resize();
  sync();
  return { sync };
}
