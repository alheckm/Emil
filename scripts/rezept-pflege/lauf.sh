#!/bin/sh
# Wöchentlicher headless-Lauf der Rezept-Pflege, angestoßen von launchd
# (siehe scripts/rezept-pflege/de.emil.rezept-pflege.plist). Von Hand testen:
#
#   ./scripts/rezept-pflege/lauf.sh
#
# --permission-prompts none: alles, was nicht in --allowedTools steht, wird
# abgelehnt statt zu hängen — es sitzt niemand da, der einen Prompt beantwortet.
set -eu

# launchd startet mit einem minimalen PATH ohne Homebrew — ohne das hier
# findet die Shell weder `claude` noch `node`.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

cd "$(dirname "$0")/../.."

LOG_DIR="scripts/rezept-pflege/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%F).log"

claude -p "/rezepte-pflegen --limit 10" \
  --permission-mode acceptEdits \
  --permission-prompts none \
  --allowedTools "Read,Write,Bash(node scripts/rezept-pflege/pflege.mjs:*),Bash(~/.mflux/venv/bin/mflux-generate:*)" \
  >> "$LOG_FILE" 2>&1
