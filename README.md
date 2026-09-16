# Bernardo’s portfolio

A nature-by-day, space-by-night portfolio for websites, videos, broadcast graphics, products and apps. The private studio manages real projects and media without rebuilding the website.

## Use the studio

Open `/admin` and sign in with the owner’s ChatGPT account. Add a project, save a draft, upload files, preview it, then publish. The portfolio displays only published snapshots. Saving changes to a published project leaves its visible version unchanged until **Publish update** is selected.

- MP4/WebM videos: up to 1 GiB each, in resumable 8 MiB parts.
- JPG/PNG/WebP images: up to 20 MiB; PDF: 25 MiB; WebVTT captions: 2 MiB.
- Up to 30 files per project. Default application storage allowance: 20 GiB including unfinished uploads. This is an application limit, not a provider storage entitlement or price promise.
- After a reload, choose the same file to resume. Saved chunks are verified by SHA-256 before continuing.
- Select a main video, cover and captions. Add a transcript and cover description for accessibility.
- Unpublish hides the project and revokes ordinary access to its files. Trash is reversible and keeps files private. From trash, **Delete permanently** removes the project and its files after confirmation.
- Detach a file, save, and remove it from any published version before permanently deleting it.
- Export the project metadata backup, and download original files separately. The JSON export does **not** contain media bytes. Keep originals and permissions in a separate backup; there is no automatic off-site backup or restore import yet.

The site’s audience setting and project publication are distinct: a published project is visible only to the audience allowed into the site. Changing the site to public does not grant access to the studio or unpublished files.

## Local development

Requires Node 22 or newer.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4320`. The local `/admin` login is a clearly labeled development simulation, stored in a temporary HttpOnly cookie. It is implemented only in `scripts/dev.mjs`, never in the deployed Worker. The preview binds to loopback, rejects other Host headers, and strips incoming identity headers. Test content persists under ignored `.local-state/`.

```sh
npm run check
npm test
npm run build
```

Tests exercise real local D1/R2 bindings, unauthorized access, cross-origin requests, draft/published separation, multipart recovery, file validation, quotas and video ranges, plus the portfolio’s animation geometry.

## Source layout

- `public/` — authored portfolio, studio and artwork. Edit here.
- `server/` — Cloudflare Worker routes, authorization, validation and media streaming.
- `db/schema.ts` — database schema.
- `drizzle/` — generated SQL migrations and metadata; preserve applied history.
- `scripts/` — build, checks and the local development dispatcher.
- `tests/` — behavior and motion tests.
- `dist/` — generated deployment output; do not edit or commit.

Uploaded media and project records live in D1/R2, not Git. Do not add private projects, videos, identity configuration, credentials, local database state or environment files to this public repository.

## Hosting and authentication

This application is designed for **OpenAI Sites** with its trusted authentication dispatcher. `.openai/hosting.json` declares logical `DB` (D1) and `BUCKET` (R2) bindings. It is private deployment configuration and is excluded from this public repository. The build emits `dist/server/index.js`, `dist/client/`, and migrations under `dist/.openai/`.

1. Configure a Sites project with D1 `DB` and R2 `BUCKET` and copy the project’s exact ID into the private hosting manifest.
2. Deploy first with `PORTFOLIO_OWNER_ID` unset. Admin access fails closed.
3. While the site is owner-private, sign in as its verified owner and inspect `/api/session` to obtain that site’s forwarded user ID.
4. Store that ID as the **server-side** `PORTFOLIO_OWNER_ID` environment value in Sites; deploy again to apply it. Do not use an email address, expose the value in browser configuration, or let the first visitor claim ownership.
5. Optionally set `PORTFOLIO_STORAGE_LIMIT_BYTES`. Keep the R2 bucket private. Its contents must be served through the Worker’s `/media/:id` checks.
6. Verify owner login and unauthorized requests before changing the site’s audience.

**Do not expose this Worker directly on an independent origin.** The `oai-authenticated-user-*` headers are trustworthy only when a provider strips visitor-supplied values and injects a verified identity. A standalone Cloudflare/Vercel/custom deployment needs a real authentication adapter that cryptographically verifies its session before supplying identity; simply copying these header names is unsafe.

The platform manages sign-in and sign-out. The app does not keep passwords. Protect the owner’s ChatGPT account with its available account security settings. No assumption is made that MFA is enabled.

After changing the schema, run `npm run db:generate` and commit SQL plus metadata. Sites applies migrations before publishing the Worker. Never rewrite an applied migration, including one applied during a failed release.

## Security and privacy

Owner allowlisting, same-origin mutation checks, prepared SQL, optimistic versions, private draft media, content size/type/signature checks, secure response headers and a studio frame policy are implemented. Video responses support byte ranges and avoid loading entire originals into Worker memory. Publication requires a rights confirmation.

This is not a malware scanning, video transcoding or copyright clearance service. File signatures are format checks, not complete file parsers. MP4/H.264/AAC and WebM are the intended browser-playable formats; unsupported codecs need re-exporting. Keep originals. Captions currently use an English track label.

See [SECURITY.md](SECURITY.md), `/privacy`, `/credits`, [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [ARTWORK.json](ARTWORK.json). Adapt notices to your own identity, providers and actual data practices when reusing this code. No claim of universal legal compliance is made.

## License

Website source code is MIT-licensed. The MIT license does not automatically apply to projects uploaded through the studio. AI artwork provenance and third-party font, icon and reference licenses are recorded separately. Preserve required notices when redistributing.
