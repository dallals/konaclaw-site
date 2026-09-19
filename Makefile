NPM := arch -arm64 npm
NPX := arch -arm64 npx

.PHONY: dev build check test e2e shots shots-placeholder
dev:               ; $(NPM) run dev
build:             ; $(NPM) run build
check:             ; $(NPX) astro check
test:              ; $(NPX) vitest run
e2e:               ; $(NPX) playwright test
shots:             ; $(NPX) tsx shots/capture.ts
shots-placeholder: ; $(NPX) tsx shots/placeholder.ts
