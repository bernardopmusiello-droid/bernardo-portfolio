# Bernardo’s little corner of the world

A welcoming pixel-art portfolio that opens on Earth and travels into space. Built with plain HTML, CSS and JavaScript. No framework, build step, API key or runtime dependencies.

[![Checks](https://github.com/bernardopmusiello-droid/bernardo-portfolio/actions/workflows/checks.yml/badge.svg)](https://github.com/bernardopmusiello-droid/bernardo-portfolio/actions/workflows/checks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## What’s inside

- Nature-first daylight theme: alpine lake, waterfalls, wildflowers, ferns, butterflies and a hiker on Earth.
- Space theme with galaxies, planets and a little astronaut on the Moon.
- A glowing pixel portal in both directions, with a gentle dissolve for reduced motion.
- Clickable nature clouds with gentle pixel rain. Click again to stop; motion preferences get a still illustration.
- Cursor-reactive artwork, keyboard navigation, project previews and responsive layouts.
- An “Ask an AI about me” launcher for ChatGPT, Claude, Grok and Perplexity. It prepares a prompt; it does not submit one or call an AI API.
- Self-hosted fonts, generated artwork and numerical tests for character motion and portal geometry.

The project cards are **illustrative placeholders**, not a record of completed client work. GitHub links are real; the other social/contact destinations are placeholders.

## Run locally

Install [Node.js 22 or newer](https://nodejs.org/), then:

```sh
git clone https://github.com/bernardopmusiello-droid/bernardo-portfolio.git
cd bernardo-portfolio
npm run dev
```

Open http://127.0.0.1:4317. No `npm install` is needed. To use a different port, set the `PORT` environment variable before running the command. The preview server binds to your computer’s loopback address.

```sh
npm run check
npm test
```

## Make it yours

| Change | File |
| --- | --- |
| Name, introduction, About, footer quotes, header source link | `dist/index.html` |
| Project titles, descriptions, images and prepared AI context | `dist/projects.js` |
| Social links, bookmarks, icons and UI behavior | `dist/app.js` |
| Colors, layout and responsive styles | `dist/styles.css` |
| Theme portal | `dist/theme-portal.js` |
| Moon animation | `dist/motion.js` |
| Hiking animation and terrain profile | `dist/earth-motion.js`, `dist/earth-profile.js` |
| Cursor interactions | `dist/interactions.js` |
| Cloud rain Easter egg | `dist/rain.js` |
| Artwork and font files | `dist/assets/` |

`dist/` is the editable source and the complete deployable website, despite its name. Keep project examples marked as placeholders until you replace them with real work. Update the name, GitHub links and `makeIntroduction()` when creating your own portfolio. Preserve the included license notices.

## Deploy

Upload the contents of `dist/` to any static web host. There is no build command. Set the publish directory to `dist` when your host asks for it. All asset paths are relative, so the site can also live under a repository subpath. See [deployment notes](docs/DEPLOYMENT.md).

This repository does not contain the owner’s private hosting configuration or credentials. Publishing this repository does not change access to an existing hosted preview.

## Accessibility and motion

The page opens in nature mode on every visit. Use the theme button or **D** to switch worlds, **⌘/Ctrl K** to search, and **Escape** to close dialogs. The footer button pauses ambient animation. Operating-system reduced motion selects a short dissolve; browsers without View Transitions switch themes directly. Touch devices keep ordinary scrolling and taps.

## Contributing

Small fixes, accessibility improvements and thoughtful experiments are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md). GitHub Actions runs the same checks used locally for pushes and pull requests.

## License and credits

The project code and Bernardo’s contributions are available under the [MIT License](LICENSE). The layout adapts [Aditya Ojha’s portfolio](https://github.com/AdityaKodez/adityaojha); its original MIT notice is retained in [dist/REFERENCE-LICENSE.txt](dist/REFERENCE-LICENSE.txt). Font and icon licenses, provider marks, artwork reuse terms and generation details are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [ARTWORK.json](ARTWORK.json).
