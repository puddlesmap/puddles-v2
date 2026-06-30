# Scheduled refresh (Sheet → website)

Google Sheet stays the source of truth. The public site and admin dashboard read **synced JSON**, not the sheet directly.

## Data flow

```text
Google Sheet (Events tab)
        ↓  CSV export (sync-events.mjs)
src/data/sheet-events.json  +  data/sync-meta.json
        ↓  Vite build
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

## Scheduled sync (GitHub Actions)

Workflow: `.github/workflows/sync-events.yml`

| Trigger | When |
|---|---|
| **Cron** | Every 2 days at 2:00 PM UTC — edit `src/data/sync-config.json` + workflow to change |
| **Manual** | GitHub → Actions → “Sync events from Google Sheet” → Run workflow |

On each run:

1. `npm run sync-events` — fetch Events tab CSV
2. `npm run build` — fail early if data breaks the app
3. Commit JSON/CSV if changed and push to `main`
4. Your host (Netlify/Vercel/GitHub Pages) redeploys on push

### Setup checklist

1. Push this repo to GitHub.
2. **Share the Google Sheet** so CSV export works without login:
   - File → Share → General access → **Anyone with the link** → Viewer
3. Enable GitHub Actions on the repo.
4. Connect your static host to `main` (auto-deploy on push).

### Recommended schedule (V1)

| Frequency | Cron | Use when |
|---|---|---|
| **Every 2 days (default)** | `0 14 */2 * *` | 2:00 PM UTC every 2 days — see `src/data/sync-config.json` |
| Every 6 hours | `0 */6 * * *` | More frequent updates |
| Once daily | `0 14 * * *` | Minimal churn |

Avoid syncing every few minutes — unnecessary deploys and Google export limits.

## Admin “Publish to site” button

On **Admin → Events**, **Publish to site** triggers the same GitHub Action as the manual workflow run:

1. Sync Events + Submissions tabs from Google Sheet
2. Commit JSON if changed
3. Push to `main` → Netlify redeploys

Requires Netlify env var **`GITHUB_DEPLOY_TOKEN`** (fine-grained PAT with **Actions: Read and write** on `puddlesmap/puddles-v2`). Admin sign-in (`ADMIN_PASSWORD`) is also required.

**Refresh from Sheet** only updates the admin dashboard in your browser — it does not deploy.

## Troubleshooting

| Problem | Fix |
|---|---|
| Sync fails in CI with 403/404 on CSV | Sheet not shared for anonymous CSV export |
| Site still stale after sync | Host didn’t redeploy — check deploy logs |
| `isPast` wrong after sync | Sync now uses **today’s date** for publishing (not a fixed demo date) |
| No commit after workflow | Sheet unchanged since last sync — expected |
