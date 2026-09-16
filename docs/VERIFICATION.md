# Verification

Run `npm run check` for JavaScript syntax and local asset-reference checks, and `npm test` for motion, geometry and development-server tests.

The Moon tests check surface clearance, planted contact, continuous takeoff/landing, downward acceleration and continuous rotation. Earth tests check the supporting boot against the illustrated terrain and the rotation seam. Portal tests check viewport coverage and interpolable geometry on phone, desktop and ultrawide dimensions.

Before release, the portfolio was checked in the Codex Chromium browser at desktop and mobile sizes. Both portal directions, repeated taps, theme reload defaults, keyboard switching, the search command, reduced motion, manual pause, resize recovery, asset loading and stable footer scroll position were exercised. Physical-device and other browser-engine testing remain useful follow-up work.

For a visual change, inspect the transition while it is moving, not just its final theme. For a content change, check that the project labels and prepared AI prompt remain truthful.
