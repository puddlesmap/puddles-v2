# Submissions pipeline

Parents submit on the website → **Admin → Submissions** (and Google Sheet mirror) → you review → **Go live** → public Puddles catalog.

## Flow

1. **Share form** (and Expansion Watch) POSTs to `/api/submissions`.
2. Netlify saves the row to **Admin store** `src/data/sheet-submissions.json` on `main` (required).
3. The same row is **mirrored to the Google Sheet Submissions tab** when `GOOGLE_APPS_SCRIPT_URL` is set (best-effort — Sheet failure does not undo Admin save).
4. **Admin `/admin/submissions`** → **Refresh submissions** loads the Admin store.
5. Review / set status (syncs back to the Admin store).
6. For **Event** submissions, click **Go live** → publishes to `sheet-events.json` (~2–4 min Netlify deploy).

## Admin actions

| Action | Effect |
|--------|--------|
| Refresh submissions | Load latest from Admin store (GitHub). Sheet CSV is fallback only. |
| Status / Approve | Updates Admin store |
| **Go live** | Approves if needed, upserts Event into public catalog, marks submission Ready/Live |
| Solved | Archives from review queue |
| Delete | Hides in this browser only |

## One-time Sheet → Admin import

```bash
npm run sync-submissions
git add src/data/sheet-submissions.json && git commit && git push
```

Then hard-refresh Admin → **Refresh submissions**.

## Environment

| Variable | Purpose |
|----------|---------|
| `GITHUB_DEPLOY_TOKEN` | Required — append/patch submissions + Go live commits |
| `GOOGLE_APPS_SCRIPT_URL` | Optional — mirrors new form rows to the Sheet |
| `GITHUB_REPO` | Optional (`owner/repo`, default `puddlesmap/puddles-v2`) |
| `ADMIN_PASSWORD` | Admin login for refresh / patch / Go live |

## Local development

```bash
# .env.local
GITHUB_DEPLOY_TOKEN=...
ADMIN_PASSWORD=...
GOOGLE_APPS_SCRIPT_URL=...   # optional Sheet mirror
```

`npm run dev` proxies `/api/submissions` through Vite middleware.

## Related

- [Admin how-to](./admin-howto.md)
- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md) (legacy)
