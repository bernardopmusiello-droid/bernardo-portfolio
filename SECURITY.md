# Security

Please report a suspected vulnerability privately to bernardomusiello@gmail.com. Include the affected page and reproduction steps, without sharing other people’s private data, secrets, or uploaded files. Do not publish an exploit before the issue can be assessed. No response-time guarantee or bug bounty is offered.

## Security boundary

Production authentication relies on OpenAI Sites stripping caller-supplied `oai-authenticated-user-*` headers and forwarding its verified identity. A fixed server-side owner ID gates every admin route. An independent unprotected Worker origin would invalidate this boundary; do not expose one. No first-visitor signup or owner-claim endpoint exists.

D1 stores separate saved-draft and published snapshots. R2 remains private. `/media/:id` authorizes every request and serves a file to a visitor only while a published project references it. Responses use `no-store`; unpublishing cannot recall files already downloaded.

Mutations require matching Origin and a custom header. SQL is parameterized. Uploads have quotas, per-file limits, extension/MIME/signature checks and bounded part reads. Resuming verifies stored chunk checksums. Writes use version checks to detect another editor tab. The studio cannot be framed by unrelated origins.

## Operational responsibilities

- Secure the owner’s ChatGPT account and recovery methods; use available MFA options.
- Preserve private R2 access and the Sites dispatcher; avoid public bucket URLs.
- Keep Node and dependencies patched. CI checks syntax and behavior; review dependency alerts.
- Export metadata and download originals to a separate backup. Backups should remain private.
- Cancel stale unfinished uploads to reclaim reserved storage.
- Review publication permissions for music, client/school work, people and third-party material.
- Review hosting logs and retention in the provider settings. This app does not promise provider log deletion or add visitor analytics.

There is no malware scanner, DRM, video transcoder, automatic off-site backup, fine-grained multi-user permissions, or claim of complete legal compliance. Format validation cannot detect all harmful or malformed media. Do not upload untrusted executable or confidential client material without permission.

If owner access is compromised, remove/change `PORTFOLIO_OWNER_ID` through the hosting environment and redeploy, then secure the account. The dashboard fails closed without the owner setting. Review published work and restore from your backups as needed.
