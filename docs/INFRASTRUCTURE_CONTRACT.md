# Navi Astro infrastructure contract

This is the compact source of truth for releases. Design details live in `design.md`; operational checklists live in `docs/ENGINEERING_STANDARD.md`.

## Content boundary

Payload is the editorial source. Astro builds from generated snapshots so builds remain deterministic and do not depend on a waking database. Snapshots must never be edited manually.

`npm run build` is intentionally offline. `npm run release:production` is the only production path: it refreshes Payload content and certificates, refuses to deploy if this creates an uncommitted snapshot diff, runs tests and type checks, builds, validates SEO routes, then deploys the `main` branch to Cloudflare Pages. Sync timestamps remain stable when source content is unchanged.

## Analytics and consent

Every public layout loads, in order:

1. `ZarazLoader` — same-origin `/cdn-cgi/zaraz/i.js` fallback when edge injection is absent;
2. `ZarazConsentBootstrap` — consent-mode mapping and primary-action focus;
3. `AnalyticsBootstrap` — page and lead events.

This trio is an architectural dependency, not optional page decoration. Tests must fail if any public layout drops or reorders it. The consent modal initially focuses `Accept All`; it must not repeatedly steal focus after the user starts navigating.

## SEO and routes

Published URLs are immutable. A changed route requires a permanent redirect, a canonical/hreflang update, and route-parity coverage. Draft and query pages remain noindex and outside sitemap. Production release fails on unexpected route loss, canonical conflicts, or sitemap drift.

## Secrets

Use encrypted dotenvx files for repository-managed runtime configuration and Cloudflare/Coolify secrets only where the platform must inject a key. Never introduce 1Password, plaintext credentials, or secret values in logs and generated snapshots.

## Release verification

Before deployment the release command runs content sync, tests, Astro check, build validation, and SEO audit. After deployment verify:

- newest article and canonical legacy routes return 200;
- sitemap contains the expected public routes only;
- `/cdn-cgi/zaraz/i.js` and `/cdn-cgi/zaraz/s.js` load;
- consent opens with `Accept All` focused;
- a consented GA request receives a successful response;
- Payload-backed navigation, team, posts, tags, and certificates have not regressed.
