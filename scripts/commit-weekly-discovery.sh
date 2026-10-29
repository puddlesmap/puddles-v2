#!/usr/bin/env bash
# Stage discovery outputs that exist, then commit and push.
# Called from .github/workflows/discover-wednesday.yml so the YAML stays a one-liner.
set -euo pipefail

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

shopt -s nullglob
paths=(
  src/data/discovery-candidates.json
  src/data/verification-state.json
  data/discovery/agent-inbox.json
  data/discovery/bay-area-*.json
  data/discovery/linden-tree-*.json
  data/discovery/linden-tree-*.csv
  data/discovery/latest-scrape-meta.json
  data/discovery/cadence-state.json
  data/discovery/weekly-summary.md
  data/discovery/expansion-lookahead-*.json
  data/discovery/core-cities-weekend-inbox.json
  data/discovery/core-weekend-*.md
  data/discovery/regional-leads-inbox.json
  data/discovery/regional-weekly-*.md
  data/verification/latest-run.json
  data/calendar-watchlist.json
  docs/calendar-watchlist-next-2-months.md
)

for path in "${paths[@]}"; do
  if [ -e "$path" ]; then
    git add -- "$path"
  fi
done

if git diff --staged --quiet; then
  echo "No discovery changes — skipping commit."
  exit 0
fi

days="${DISCOVERY_DAYS:-90}"
git commit -m "chore: weekly discovery pass (${days}-day horizon)"
git pull --rebase origin "${GITHUB_REF_NAME:-main}"
git push
