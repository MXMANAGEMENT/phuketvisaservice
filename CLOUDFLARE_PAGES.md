# Cloudflare Pages deployment

This repository uses a zero-dependency static build pipeline.

## Pages settings

- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build`
- Build output directory: `dist`

The `functions/` directory intentionally remains at the repository root. Do not copy it into `dist/`; Cloudflare Pages uses the root `functions/` directory for file-based Pages Functions routing.

## Required server-side environment variables

Configure secrets in Cloudflare Pages settings:

- `GA4_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `META_PIXEL_ID` (only when Meta CAPI is enabled)
- `META_CAPI_TOKEN` (secret; only when Meta CAPI is enabled)
- `META_TEST_CODE` (optional)

Never commit API secrets or access tokens.

## Public site configuration

Non-secret, site-wide values live in:

`config/site.json`

That file is the source of truth for the primary domain, phone/WhatsApp number and browser tracking IDs.

## Quality gate

`npm run check` performs:

1. source verification;
2. deterministic build to `dist/`;
3. output verification.

The build fails on high-risk regressions such as:

- legacy or placeholder domains;
- placeholder/fake phone numbers;
- `TODO_` values;
- invalid/mismatched GA4 IDs;
- duplicate consent implementations;
- invalid JSON-LD;
- wrong language attributes;
- broken canonical origins/paths;
- unbalanced nav/footer markup;
- missing local static assets.

GitHub Actions runs the same quality gate on pull requests and pushes to `main`.
