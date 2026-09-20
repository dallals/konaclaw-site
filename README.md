# konaclaw.ai

Marketing and capability reference for KonaClaw. Static Astro site, Cloudflare Pages.

- `make dev` — local dev server
- `make build` / `make check` / `make test` / `make e2e`
- `make shots` — regenerate screenshots into `src/assets/shots/` from the demo profile (needs the KonaClaw code repo at `$KC_REPO`, default `~/Desktop/claudeCode/SammyClaw`). Never commit a screenshot taken any other way. Needs the always-on local engine on :8901 for notebook embeddings; the pipeline is not hermetic without it.
- `make shots-placeholder` — labeled placeholders so the build passes before real shots exist

Feature facts live only in `src/content/features/*.yaml`. Set `status: shipped | v1_1 | planned` deliberately; the build fails if a page references a screenshot that does not exist under `src/assets/shots/`, and the e2e suite rejects any `v1_1` feature appearing outside the "Coming in 1.1" section.

Waitlist posts to Buttondown; set `PUBLIC_BUTTONDOWN_USERNAME` (see `.env.example`).

## Cloudflare Pages settings

- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: `NODE_VERSION=26`, `PUBLIC_BUTTONDOWN_USERNAME`

`sharp` is a direct dependency — Astro's image service needs it to emit the WebP
derivatives — and its Linux binaries are already pinned in `package-lock.json`, so the
Pages build needs no extra configuration for it.
