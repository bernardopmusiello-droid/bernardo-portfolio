# Security

Security fixes target the latest `main` branch. Older snapshots are not maintained separately.

Please report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/bernardopmusiello-droid/bernardo-portfolio/security/advisories/new). Include the affected file or feature, reproduction steps and the likely impact. Do not post credentials or working exploits in a public issue. There is no guaranteed response time or bounty program.

This is a static website. It has no account system, database, contact-form backend, analytics or server-side AI integration. The AI launcher creates links to third-party services; using those links is the visitor’s choice. Do not embed secrets in client-side JavaScript.

`scripts/serve.mjs` is a local development server bound to loopback. Use a maintained static hosting service for a public deployment.
