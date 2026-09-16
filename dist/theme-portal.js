// A single clock drives both the stepped reveal and its luminous boundary.
const DURATION = 1160;
const STEPS = 48;
const SEGMENTS = 160;
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (t) => 1 - (1 - t) ** 2.4;

export function portalGeometry(width, height, x, y) {
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 32;
  const grid = width < 600 ? 5 : 7;
  const frames = Array.from({ length: STEPS + 1 }, (_, index) => {
    const r = radius * ease(index / STEPS);
    const points = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = i / SEGMENTS * Math.PI * 2;
      const px = x + Math.round(Math.cos(angle) * r / grid) * grid;
      const py = y + Math.round(Math.sin(angle) * r / grid) * grid;
      if (i) points.push([px, points.at(-1)[1]]);
      points.push([px, py]);
    }
    return points;
  });
  return { radius, frames };
}

export function initThemePortal({ button, applyTheme, isQuiet, onBusy }) {
  let busy = false;
  let transition = null;
  let raf = 0;
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'theme-portal-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const stop = () => transition?.skipTransition();
  addEventListener('resize', stop, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  function draw(progress, geometry, x, y, target, width, height) {
    ctx.clearRect(0, 0, width, height);
    const frame = Math.min(STEPS - 1, Math.floor(progress * STEPS));
    const blend = progress * STEPS - frame;
    const a = geometry.frames[frame], b = geometry.frames[frame + 1];
    const fade = Math.min(1, progress * 12) * clamp((1 - progress) * 5);
    const night = target === 'dark';
    const color = night ? '#c7c6ff' : '#fff3bc';
    ctx.beginPath();
    a.forEach(([ax, ay], i) => {
      const px = ax + (b[i][0] - ax) * blend, py = ay + (b[i][1] - ay) * blend;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.globalAlpha = fade * 0.16;
    ctx.strokeStyle = night ? '#8ea0ff' : '#b9d888';
    ctx.lineWidth = 26;
    ctx.stroke();
    ctx.globalAlpha = fade * 0.45;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.globalAlpha = fade * 0.92;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    const radius = geometry.radius * ease(progress);
    for (let i = 0; i < 92; i++) {
      const angle = i * 2.399963;
      const phase = (progress * 2.2 + (i * 0.618) % 1) % 1;
      const distance = radius + (phase - 0.45) * 104;
      const px = Math.round((x + Math.cos(angle) * distance) / 3) * 3;
      const py = Math.round((y + Math.sin(angle) * distance) / 3) * 3;
      if (px < -12 || py < -12 || px > width + 12 || py > height + 12) continue;
      const size = i % 4 === 0 ? 4 : 2;
      ctx.globalAlpha = fade * Math.sin(phase * Math.PI) * 0.8;
      ctx.fillStyle = night ? ['#eee4bc', '#b8c6f8', '#b0bea0'][i % 3] : ['#769657', '#d7ba6d', '#eff1c3'][i % 3];
      if ((night && phase > 0.45) || (!night && phase < 0.45)) {
        ctx.fillRect(px - size, py, size * 3, size);
        ctx.fillRect(px, py - size, size, size * 3);
      } else {
        ctx.fillRect(px, py, size * 2, size);
        ctx.fillRect(px + size, py - size, size * 2, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  return async function switchTheme(target) {
    if (busy) return;
    busy = true;
    onBusy(true);
    button.setAttribute('aria-busy', 'true');
    document.querySelector('#theme-invitation')?.setAttribute('hidden', '');
    const quiet = isQuiet();
    let applied = false;
    const apply = () => { if (!applied) { applyTheme(target); applied = true; } };
    try {
      if (!document.startViewTransition || document.hidden) { apply(); return; }
      if (!quiet) {
        await button.animate([
          { transform: 'scale(1)', offset: 0 },
          { transform: 'scale(.72) rotate(-18deg)', offset: .7 },
          { transform: 'scale(1)', offset: 1 },
        ], { duration: 140, easing: 'ease-in-out' }).finished;
      }
      const rect = button.getBoundingClientRect();
      const width = innerWidth, height = innerHeight;
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      root.classList.add(quiet ? 'theme-dissolve' : 'theme-portal');
      transition = document.startViewTransition(apply);
      // finished handles both the normal path and browser-skipped captures.
      const finished = transition.finished.catch(() => {});
      await transition.ready;
      if (quiet) {
        root.animate({ opacity: [0, 1] }, {
          duration: 180, easing: 'ease-out', pseudoElement: '::view-transition-new(root)',
        });
      } else {
        const geometry = portalGeometry(width, height, x, y);
        const animation = root.animate(geometry.frames.map((points) => ({
          clipPath: `polygon(${points.map(([px, py]) => `${px}px ${py}px`).join(',')})`,
        })), { duration: DURATION, easing: 'linear', fill: 'both', pseudoElement: '::view-transition-new(root)' });
        const tick = () => {
          const progress = clamp((animation.currentTime || 0) / DURATION);
          draw(progress, geometry, x, y, target, width, height);
          if (progress < 1) raf = requestAnimationFrame(tick);
        };
        tick();
      }
      await finished;
    } catch {
      // Unsupported pseudo animations, interrupted captures, and hidden tabs
      // must still reach the requested theme and release the switch.
      apply();
      transition?.skipTransition();
    } finally {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      transition = null;
      root.classList.remove('theme-portal', 'theme-dissolve');
      button.removeAttribute('aria-busy');
      busy = false;
      onBusy(false);
    }
  };
}
