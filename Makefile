NPM := arch -arm64 npm
NPX := arch -arm64 npx

.PHONY: dev build check test e2e shots shots-placeholder
dev:               ; $(NPM) run dev
build:             ; $(NPM) run build
check:             ; $(NPX) astro check
test:              ; $(NPX) vitest run
e2e:
	$(NPX) astro preview --background --host 127.0.0.1 --port 4321
	$(NPX) playwright test; rc=$$?; $(NPX) astro preview stop; exit $$rc
shots:             ; bash shots/run.sh
shots-placeholder: ; $(NPX) tsx shots/placeholder.ts
