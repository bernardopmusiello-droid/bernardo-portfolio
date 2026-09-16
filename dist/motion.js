/** One clock controls the planted stride, ballistic jump, and moon rotation. */
export const motionConfig = Object.freeze({
  radius: 52,
  stance: 0.3,
  flight: 1.1,
  height: 16,
  stride: 18,
  cx: 135,
  cy: 170,
  anchorX: 57,
  anchorY: 88,
});
export function moonPose(elapsed) {
  const {
    radius: R,
    stance: S,
    flight: F,
    height: H,
    stride,
    cx,
    cy,
  } = motionConfig;
  const period = S + F,
    omega = stride / (R * period);
  const phase = ((elapsed % period) + period) % period;
  let x,
    y,
    frame = 1,
    squash = 1;
  const contact = phase < S;
  if (contact) {
    const a = omega * (phase - S / 2);
    x = cx + R * Math.sin(a);
    y = cy - R * Math.cos(a);
    // Compress after impact, recover before push-off; the supporting foot stays fixed.
    squash =
      phase < 0.05
        ? 1 - (0.06 * phase) / 0.05
        : phase < 0.1
          ? 0.94
          : phase < 0.23
            ? 0.94 + (0.06 * (phase - 0.1)) / 0.13
            : 1;
  } else {
    const u = (phase - S) / F;
    const a = (omega * S) / 2;
    x = cx + R * Math.sin(a) * (1 - 2 * u);
    y = cy - R * Math.cos(a) - 4 * H * u * (1 - u);
    frame =
      u < 0.12
        ? 1
        : u < 0.29
          ? 2
          : u < 0.48
            ? 0
            : u < 0.68
              ? 4
              : u < 0.83
                ? 2
                : 1;
  }
  return {
    x,
    y,
    frame,
    squash,
    contact,
    phase,
    moonAngle: omega * elapsed,
    height: cy - R - y,
  };
}
export function initMoonScene({ scene, sprite, texture, shadow, isPaused }) {
  let elapsed = 0.15,
    last = null,
    raf = 0,
    inView = false;
  function render(pose) {
    sprite.style.left = `${pose.x - motionConfig.anchorX}px`;
    sprite.style.top = `${pose.y - motionConfig.anchorY}px`;
    sprite.style.transform = `scaleY(${pose.squash})`;
    sprite.style.backgroundPosition = `${-pose.frame * 96}px 0`;
    texture.style.transform = `rotate(${pose.moonAngle}rad)`;
    shadow.style.opacity = String(0.3 - (Math.max(0, pose.height) / 16) * 0.15);
    shadow.style.transform = `scaleX(${1 - (Math.max(0, pose.height) / 16) * 0.2})`;
    // These attributes also make the animation state inspectable during visual QA.
    scene.dataset.phase = pose.contact ? "planted" : "airborne";
    scene.dataset.footX = pose.x.toFixed(3);
    scene.dataset.footY = pose.y.toFixed(3);
  }
  function active() {
    return inView && !document.hidden && !isPaused();
  }
  function tick(now) {
    raf = 0;
    if (!active()) {
      last = null;
      return;
    }
    if (last !== null) elapsed += Math.min((now - last) / 1000, 0.05);
    last = now;
    render(moonPose(elapsed));
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = null;
    if (active()) raf = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
      sync();
    },
    { threshold: 0 },
  );
  observer.observe(scene);
  document.addEventListener("visibilitychange", sync);
  render({ ...moonPose(elapsed), squash: 1 });
  return {
    sync,
    reset() {
      elapsed = 0.15;
      render({ ...moonPose(elapsed), squash: 1 });
      sync();
    },
  };
}
