import test from "node:test";
import assert from "node:assert/strict";
import { hikerPose, surfaceRadius, earthConfig } from "../dist/earth-motion.js";
import { hikerAnchors } from "../dist/earth-profile.js";

test("the supporting boot follows the illustrated terrain over two full Earth turns", () => {
  for (let i = 0; i <= 12800; i++) {
    const pose = hikerPose(i / 200);
    const dx = pose.footX - earthConfig.cx, dy = pose.footY - earthConfig.cy;
    const surface = surfaceRadius(Math.atan2(dy, dx) - pose.earthAngle);
    assert.ok(Math.abs(Math.hypot(dx, dy) - surface) < 0.02, `terrain contact at sample ${i}`);
    const boot = hikerAnchors[pose.frame];
    assert.ok(Math.abs(pose.top + boot.y * earthConfig.frameSize / 96 - pose.footY) < 1e-8);
    assert.ok(pose.footY < earthConfig.cy, "hiker stays on the upper surface");
  }
});

test("crossing the globe's rotation seam preserves terrain height", () => {
  assert.ok(Math.abs(surfaceRadius(-1e-8) - surfaceRadius(1e-8)) < 0.001);
  for (let angle = -10; angle <= 10; angle += 0.1) {
    assert.ok(Math.abs(surfaceRadius(angle) - surfaceRadius(angle + Math.PI * 2)) < 1e-8);
  }
});
