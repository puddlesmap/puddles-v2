# Submissions pipeline

Parents submit on the website → **Admin → Submissions** → you review → **Go live** → public Puddles catalog.

Google Sheet is **not** required. Submissions are stored in `src/data/sheet-submissions.json` via GitHub.

## Flow

1. **Share form** (and Expansion Watch) POSTs to `/api/submissions`.
2. Netlify function appends a row to `sheet-submissions.json` on `main` (Status = New).
3. **Admin `/admin/submissions`** → **Refresh submissions** loads the Admin store (GitHub).
4. Review / set status (local-first; syncs back to the store).
5. For **Event** submissions, click **Go live** → publishes to `sheet-events.json` via the same publish API as Discovery (~2–4 min Netlify deploy).

## Admin actions

| Action | Effect |
|--------|--------|
| Refresh submissions | Load latest from Admin store (GitHub). Sheet CSV is fallback only. |
| Status / Approve | Updates Admin store |
| **Go live** | Approves if needed, upserts Event into public catalog, marks submission Ready/Live |
| Solved | Archives from review queue |
| Delete | Hides in this browser only |

## Environment

| Variable | Purpose |
|----------|---------|
| `GITHUB_DEPLOY_TOKEN` | Required — append/patch submissions + Go live commits |
| `GITHUB_REPO` | Optional (`owner/repo`, default `puddlesmap/puddles-v2`) |
| `ADMIN_PASSWORD` | Admin login for refresh / patch / Go live |

Legacy Sheet vars (`GOOGLE_APPS_SCRIPT_URL`, etc.) are optional fallback only.

## Local development

```bash
# .env.local
GITHUB_DEPLOY_TOKEN=...
ADMIN_PASSWORD=...
```

`npm run dev` proxies `/api/submissions` through Vite middleware.

## Related

- [Admin how-to](./admin-howto.md)
- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md) (legacy)
