# Security Policy

This platform handles personal data for a youth sports club, including information about children, so we take security seriously and appreciate the effort of anyone who reports a genuine issue responsibly.

## Reporting a vulnerability

If you believe you've found a security vulnerability in this platform, please report it privately rather than opening a public issue.

**Email:** [security contact email — to be added]

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce it
- Any relevant logs, screenshots, or proof-of-concept code

We'll acknowledge your report as soon as we can, investigate, and keep you updated as we work on a fix. We ask that you give us a reasonable amount of time to address an issue before disclosing it publicly, and that you avoid accessing, modifying, or deleting data that isn't your own while investigating.

## Scope

In scope: the platform's source code in this repository and its production deployment at [dyniblazers.co.uk](https://dyniblazers.co.uk).

Out of scope: vulnerabilities in third-party services we depend on (hosting, database, storage, or email providers) — please report those directly to the provider concerned.

## Our approach

A few things worth knowing, at a high level:

- Traffic is served over HTTPS with modern browser security headers (including a Content Security Policy) in place.
- Passwords are never stored in plain text, and sign-in is protected against repeated automated attempts.
- Access to player and safeguarding information is limited by role — a coach only sees their own team, for example — not just by policy but enforced in code.
- Anyone can request a copy of their own data, or have their account deleted, from within the platform at any time.

For the technical detail behind these, see [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md); if you're a maintainer looking for the full internal security reference, see `docs/SECURITY-INTERNAL.md`.
