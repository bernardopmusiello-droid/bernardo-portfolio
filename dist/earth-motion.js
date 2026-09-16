import { earthProfile, hikerAnchors } from "./earth-profile.js";

const TAU = Math.PI * 2;
export const earthConfig = Object.freeze({ cx: 150, cy: 195, size: 184, frameSize: 128, stepDuration: 0.23, turnDuration: 32 });

/** Sample the generated Earth's actual silhouette, including its larger biomes. */
export function surfaceRadius(angle) {
  const degrees = ((angle * 180 / Math.PI) % 360 + 360) % 360;
  const index = Math.floor(degrees);
  const blend = degrees - index;
  return (earthProfile[index] * (1 - blend) + earthProfile[(index + 1) % 360] * blend) * earthConfig.size / 512;
}

export function hikerPose(elapsed) {
  const { cx, cy, frameSize, stepDuration, turnDuration } = earthConfig;
  const frame = Math.floor(elapsed / stepDuration) % hikerAnchors.length;
  const anchor = hikerAnchors[frame];
  const earthAngle = -elapsed / turnDuration * TAU;
  // Keep his torso centered. The supporting boot changes with each walk pose.
  const left = cx - frameSize / 2;
  const footX = left + anchor.x * frameSize / 96;
  const offset = footX - cx;
  let angle = -Math.PI / 2;
  let radius = surfaceRadius(angle - earthAngle);
  for (let i = 0; i < 3; i++) {
    angle = -Math.PI / 2 + Math.asin(Math.max(-0.8, Math.min(0.8, offset / radius)));
    radius = surfaceRadius(angle - earthAngle);
  }
  const footY = cy + Math.sin(angle) * radius;
  return { frame, left, top: footY - anchor.y * frameSize / 96, footX, footY, earthAngle };
}

export function initEarthScene({ scene, sprite, earth, shadow, isPaused }) {
  let elapsed = 0, last = null, raf = 0, inView = false;
  const active = () => inView && !document.hidden && !isPaused();
  function render() {
    const pose = hikerPose(elapsed);
    sprite.style.left = `${pose.left}px`;
    sprite.style.top = `${pose.top.toFixed(2)}px`;
    sprite.style.backgroundPosition = `${-pose.frame * earthConfig.frameSize}px 0`;
    earth.style.transform = `rotate(${pose.earthAngle}rad)`;
    shadow.style.left = `${pose.footX - 9}px`;
    shadow.style.top = `${pose.footY - 1}px`;
    scene.dataset.frame = String(pose.frame);
    scene.dataset.footX = pose.footX.toFixed(3);
    scene.dataset.footY = pose.footY.toFixed(3);
  }
  function tick(now) {
    raf = 0;
    if (!active()) { last = null; return; }
    if (last !== null) elapsed += Math.min((now - last) / 1000, 0.05);
    last = now;
    render();
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = null;
    if (active()) raf = requestAnimationFrame(tick);
  }
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    sync();
  }).observe(scene);
  document.addEventListener("visibilitychange", sync);
  render();
  return { sync, reset() { elapsed = 0; render(); sync(); } };
}
