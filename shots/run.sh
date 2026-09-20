#!/bin/bash
# Boots a demo supervisor + dashboard dev server, seeds, captures, tears down.
#
#   bash shots/run.sh          seed, capture, tear down (what `make shots` runs)
#   bash shots/run.sh --keep   seed, then leave both servers up for hand work
#   bash shots/run.sh --stop   kill the servers a previous --keep left running
set -euo pipefail
KC_REPO="${KC_REPO:-$HOME/Desktop/claudeCode/SammyClaw}"
DEMO="$HOME/KonaClawDemo"

KEEP=0
case "${1:-}" in
  --keep) KEEP=1 ;;
  --stop)
    stopped=0
    for pf in "$DEMO/sup.pid" "$DEMO/dash.pid"; do
      if [ -s "$pf" ] && kill -- -"$(cat "$pf")" 2>/dev/null; then stopped=1; fi
      rm -f "$pf"
    done
    [ "$stopped" = 1 ] && echo "stopped the demo supervisor and dashboard" || echo "nothing was running"
    exit 0 ;;
  "") ;;
  *) echo "usage: bash shots/run.sh [--keep|--stop]" >&2; exit 64 ;;
esac

# macOS has no `setsid` binary. This one-liner calls the setsid() syscall on
# itself, writes its OWN pid to a file (argv[1]) — that pid is preserved
# through the execvp() that follows — then execs into the target command
# (argv[2:]).
#
# We read the pid back from that file instead of trusting `$!`: under
# `bash shots/run.sh` (a non-interactive script, job control off) bash forks
# an *extra* process to run each backgrounded `( ... )` subshell's last
# command rather than exec-replacing the subshell in place, so `$!` ends up
# naming the outer subshell — which never calls setsid() and stays in
# run.sh's own process group — not the detached, self-group-leader process
# this script actually needs to kill. Verified by reproduction; `kill -- -"$!"`
# silently no-ops and leaks the supervisor/dashboard otherwise.
SETSID_PY='
import os, sys
os.setsid()
with open(sys.argv[1], "w") as f:
    f.write(str(os.getpid()))
os.execvp(sys.argv[2], sys.argv[2:])
'
wait_for_pidfile() {  # wait_for_pidfile <pidfile> -> prints the pid on stdout
  local pidfile=$1
  for _ in $(seq 1 100); do
    [ -s "$pidfile" ] && { cat "$pidfile"; return 0; }
    sleep 0.1
  done
  return 1
}

cleanup() { [ -n "${SUP_PID:-}" ] && kill -- -"$SUP_PID" 2>/dev/null || true; [ -n "${DASH_PID:-}" ] && kill -- -"$DASH_PID" 2>/dev/null || true; }
trap cleanup EXIT

python3 shots/seed_demo.py

rm -f "$DEMO/sup.pid" "$DEMO/dash.pid"
# KC_EMBED_* points the notebooks indexer at the same local oMLX engine the
# real Kona uses (127.0.0.1:8901, already running) so URL sources can
# actually reach "ready" — env -i's clean environment has no embeddings
# backend by default (falls back to Ollama at :11434, not running here), and
# every notebook source stays "pending"/"failed" forever without one. Only
# an embeddings model + a local inference URL are added; no secrets, no
# ~/.konaclaw.env values (Telegram token, mail backend) are inherited, and
# only invented demo text / public-domain book text is ever sent to it.
# KC_CHROME_TOKEN is pre-set so kc_supervisor/chrome_token.py never reads or
# writes the real ~/.konaclaw.env (it only touches that file when the token
# isn't already in the environment).
# Needs the always-on local engine on :8901 for notebook embeddings
# (KC_EMBED_*); the pipeline is not hermetic without it.
( cd "$KC_REPO/kc-supervisor" && env -i HOME="$HOME" PATH="$PATH" \
    LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 TMPDIR="${TMPDIR:-/tmp}" \
    KC_HOME="$DEMO" KC_PORT=8766 KC_DEFAULT_AGENT=Kona-AI \
    KC_TRIGGERS_ENABLED=true KC_CHROME_TOKEN=demo-not-a-real-token KC_NOTEBOOKS_ENABLED=true \
    KC_EMBED_BACKEND=engine KC_EMBED_URL=http://127.0.0.1:8901/v1 KC_EMBED_MODEL=modernbert-embed-base \
    python3 -c "$SETSID_PY" "$DEMO/sup.pid" .venv/bin/kc-supervisor >"$DEMO/supervisor.log" 2>&1 ) &
SUP_PID=$(wait_for_pidfile "$DEMO/sup.pid") || { echo "demo supervisor never wrote a pidfile; see $DEMO/supervisor.log"; exit 1; }
for i in $(seq 1 60); do curl -sf http://127.0.0.1:8766/healthz >/dev/null && break; sleep 1; done
curl -sf http://127.0.0.1:8766/healthz >/dev/null || { echo "demo supervisor did not come up; see $DEMO/supervisor.log"; exit 1; }

python3 shots/seed_triggers.py

# --host 127.0.0.1 forces IPv4: on this machine a bare `--port` binds Vite to
# ::1 only, so a plain `curl http://127.0.0.1:5173` (used below, and by
# capture.ts's WebKit) gets connection-refused with no indication anything
# is wrong in the vite log. Verified by reproduction.
( cd "$KC_REPO/kc-dashboard" && VITE_KC_SUPERVISOR_URL=http://127.0.0.1:8766 \
    python3 -c "$SETSID_PY" "$DEMO/dash.pid" arch -arm64 npm run dev -- --port 5173 --host 127.0.0.1 >"$DEMO/dashboard.log" 2>&1 ) &
DASH_PID=$(wait_for_pidfile "$DEMO/dash.pid") || { echo "dashboard never wrote a pidfile; see $DEMO/dashboard.log"; exit 1; }
for i in $(seq 1 60); do curl -sf http://127.0.0.1:5173 >/dev/null && break; sleep 1; done
curl -sf http://127.0.0.1:5173 >/dev/null || { echo "dashboard did not come up; see $DEMO/dashboard.log"; exit 1; }

if [ "$KEEP" = 1 ]; then
  trap - EXIT   # --keep means leave them running; the EXIT trap would kill them
  echo "demo supervisor: http://127.0.0.1:8766"
  echo "dashboard:       http://127.0.0.1:5173"
  echo "run \`bash shots/run.sh --stop\` when done"
  exit 0
fi

if [ ! -d "$DEMO/notebooks" ] || [ -z "$(ls -A "$DEMO/notebooks" 2>/dev/null)" ]; then
  cat <<'MSG'
The demo notebook does not exist yet. One-time step, done by hand so it is real:
Run `bash shots/run.sh --keep`, open http://127.0.0.1:5173/notebooks, create a
notebook named "Field Guide to Local Birds" with two Project Gutenberg URL
sources, wait for Ready, run `bash shots/run.sh --stop`, then `make shots` again.
MSG
  exit 2
fi

arch -arm64 npx tsx shots/capture.ts
