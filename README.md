# konaclaw.ai

Marketing and capability reference for KonaClaw. Static Astro site, Cloudflare Pages.

- `make dev` — local dev server
- `make build` / `make check` / `make test` / `make e2e`
- `make shots` — regenerate screenshots from the demo profile (needs the KonaClaw code repo at `$KC_REPO`, default `~/Desktop/claudeCode/SammyClaw`). Never commit a screenshot taken any other way.
- `make shots-placeholder` — labeled placeholders so the build passes before real shots exist

Feature facts live only in `src/content/features/*.yaml`. Set `status: shipped | v1_1 | planned` deliberately; the build rejects entries whose screenshot is missing, and the e2e suite rejects any `v1_1` feature appearing outside the "Coming in 1.1" section.

Waitlist posts to Buttondown; set `PUBLIC_BUTTONDOWN_USERNAME` (see `.env.example`).
