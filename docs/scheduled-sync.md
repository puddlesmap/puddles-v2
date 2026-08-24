# Scheduled refresh (Sheet → website)

**Phase A (Admin-first):** automatic Sheet sync is **off**. The public catalog is updated by **Admin → Go live** (Discovery or Submissions), which commits `sheet-events.json` to GitHub.

Google Sheet is **legacy / optional** — use manual import only when you need to pull old rows.

## Data flow (normal)

```text
Discovery / Submissions → Admin Go live
        ↓  publish-events API
src/data/sheet-events.json  +  sync-meta.json
        ↓  Netlify deploy (~2–4 min)
Public website
```

## Legacy data flow (manual import)

```text
Google Sheet (Events tab)
        ↓  CSV export (sync-events.mjs)
src/data/sheet-events.json  +  data/sync-meta.json
        ↓  build + deploy
Public website + Admin dashboard
```

## Manual sync (local)

```bash
npm run sync-events
npm run build   # optional — verify before deploy
```

Writes:

| File | Purpose |
|---|---|
| `src/data/sheet-events.json` | All events for app + admin |
| `data/events-export.csv` | Cached CSV from sheet |
| `data/sync-meta.json` | `syncedAt`, event counts |

## GitHub Actions (manual only)

Workflow: `.github/workflows/sync-events.yml`

| Trigger | When |
|---|---|
| **Manual** | GitHub → Actions → “Sync events from Google Sheet” → Run workflow |
| ~~Cron~~ | **Disabled** — was every 2 days; retired in Phase A |

On each run:

1. `npm run sync-events` — fetch Events tab CSV
2. `npm run build` — fail early if data breaks the app
3. Commit JSON/CSV if changed and push to `main`
4. Netlify redeploys on push

### Setup checklist (legacy import)

1. Push this repo to GitHub.
2. **Share the Google Sheet** so CSV export works without login:
   - File → Share → General access → **Anyone with the link** → Viewer
3. Enable GitHub Actions on the repo.

## Admin “Legacy: import Sheet → site” button

On **Admin → Events**, this triggers the same GitHub Action as the manual workflow run. A confirmation dialog warns that Sheet import can overwrite Admin edits.

**Prefer:** Discovery or Submissions → **Go live**.

**Legacy: preview Sheet in browser** only updates the admin dashboard in your browser — it does not deploy.

## Troubleshooting

| Problem | Fix |
|---|---|
| Sync fails in CI with 403/404 on CSV | Sheet not shared for anonymous CSV export |
| Site still stale after Go live | Wait ~2–4 min for Netlify deploy |
| Sheet import overwrote Admin edits | Avoid legacy import; use Go live. Re-run Go live or edit in Admin (Phase B) |
| `isPast` wrong after sync | Sync uses **today’s date** for publishing |
| No commit after workflow | Sheet unchanged since last sync — expected |
