# Verification

September 16, 2026: 17 automated tests passed with real local D1/R2 bindings, covering authorization, CSRF, private media, draft/public snapshots, optimistic writes, multipart checksums/recovery, byte ranges, upload validation, quota enforcement, trash and confirmed deletion. Existing moon/Earth/transition geometry tests passed. Syntax and local asset references passed. npm audit reported no known vulnerabilities for the pinned dependency tree.

Browser checks covered owner sign-in simulation, project creation, multi-file upload, saving, private preview, publishing and public project rendering. A generated H.264 MP4 decoded at 640x360 with a three-second duration. Multipart integration testing crossed the 8 MiB boundary; the 1 GiB limit is enforced in code, but a complete 1 GiB browser upload was not performed.

These checks do not certify malware detection, all video codecs, account MFA, copyright permissions, universal legal compliance or automatic backup recovery.
