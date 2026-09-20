# Visa Service Phuket

Static multilingual website deployed with Cloudflare Pages.

## Local verification

```bash
npm ci
npm run verify
```

## Cloudflare Pages

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node.js: `20`

Cloudflare Pages discovers the `functions/` directory at the repository root. Do not move it into `dist/`.

Shared business data and localized navigation live in `config/site.mjs`. During the build, `scripts/shared-components.mjs` renders the standard header, footer, and tracking configuration into all regular pages. The three standalone comparison guides retain their dedicated article layout.

Every pull request and push to `main` runs the same quality gate in GitHub Actions. The build fails for broken internal assets, invalid JSON-LD, wrong locale metadata, foreign canonicals, tracking placeholders, leaked revoked secrets, inconsistent phone numbers, or sitemap drift.
