# Submissions pipeline

Parents submit on the website → **Admin → Submissions** → you review → **Go live** → public Puddles catalog.

Google Sheet is **optional / legacy**. Admin store (`src/data/sheet-submissions.json` via GitHub) is the source of truth.

## Flow

```text
Share form  →  POST /api/submissions  →  Admin store (required)
                                    ↳  Google Sheet mirror (optional)
Admin Submissions  →  review / Approve
Event rows  →  Go live  →  sheet-events.json  →  public site (~2–4 min)
```

1. **Share form** (and Expansion Watch) POSTs to `/api/submissions`.
2. Netlify appends to **Admin store** on `main` (Status = New). Required.
3. Optionally mirrors the same row to the Google Sheet when `GOOGLE_APPS_SCRIPT_URL` is set and `SUBMISSIONS_MIRROR_TO_SHEET` is not `0`. Sheet failure never undoes the Admin save.
4. **Admin `/admin/submissions`** → **Refresh submissions** loads the Admin store (auto on open).
5. Review / set status locally first; syncs to the Admin store (best-effort).
6. For **Event** submissions, **Go live** promotes into the Admin Events cache and publishes via `/api/publish-events`.

## Admin actions

| Action | Effect |
|--------|--------|
| Refresh submissions | Load latest from Admin store. Sheet CSV is fallback only — can overwrite local review state. |
| Status / Approve | Local-first; patches Admin store |
| **Go live** | Approves if needed, upserts Event into public catalog, marks submission Ready/Live |
| Solved | Archives from review queue |
| Delete | Hides in this browser only |

## Environment

| Variable | Purpose |
|----------|---------|
| `GITHUB_DEPLOY_TOKEN` | Required — Admin store + Go live commits |
| `ADMIN_PASSWORD` | Admin login for refresh / patch / Go live |
| `GOOGLE_APPS_SCRIPT_URL` | Optional — Sheet mirror for new form rows |
| `SUBMISSIONS_MIRROR_TO_SHEET` | Optional — default `1`; set `0` for Admin-only intake |
| `GITHUB_REPO` | Optional (`owner/repo`, default `puddlesmap/puddles-v2`) |

## One-time Sheet → Admin import

```bash
npm run sync-submissions
git add src/data/sheet-submissions.json && git commit && git push
```

Then hard-refresh Admin → **Refresh submissions**.

## Local development

```bash
# .env.local
GITHUB_DEPLOY_TOKEN=...
ADMIN_PASSWORD=...
# optional Sheet mirror:
# GOOGLE_APPS_SCRIPT_URL=...
# SUBMISSIONS_MIRROR_TO_SHEET=1
```

`npm run dev` proxies `/api/submissions` through Vite middleware.

## Related

- [Admin how-to](./admin-howto.md)
- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md) (legacy)
