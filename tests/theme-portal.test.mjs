import test from 'node:test';
import assert from 'node:assert/strict';
import { portalGeometry } from '../dist/theme-portal.js';

function contains(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

test('stepped reveal covers every viewport corner on phone, desktop and ultrawide', () => {
  for (const [w, h] of [[320, 568], [390, 844], [1156, 779], [2560, 1440]]) {
    for (const [x, y] of [[w - 40, 32], [w / 2, 32], [20, h - 20]]) {
      const { frames } = portalGeometry(w, h, x, y);
      assert.ok(frames[0].every(([px, py]) => px === x && py === y));
      for (const corner of [[0, 0], [w, 0], [w, h], [0, h]]) {
        assert.ok(contains(frames.at(-1), ...corner), `${w}x${h} must cover ${corner}`);
      }
    }
  }
});

test('both directions share finite, interpolable geometry with an outward progression', () => {
  const { frames } = portalGeometry(390, 844, 350, 32);
  let extent = 0;
  for (const points of frames) {
    assert.equal(points.length, frames[0].length);
    assert.ok(points.flat().every(Number.isFinite));
    const next = Math.max(...points.map(([x]) => x));
    assert.ok(next >= extent);
    extent = next;
  }
});
