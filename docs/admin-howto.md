# Admin how-to (twice-a-week review)

Quick ops guide for `/admin`. Rule of thumb: **Admin is for review and Sheet writes; deploy only when you want the public site updated.**

## Typical session

1. **Discovery** (`/admin/discovery`) — review the queue
2. **Events** (`/admin/events`) — Refresh from Sheet, set Published
3. **Publish to site** — once at the end when something should go live
4. **Submissions** (`/admin/submissions`) — as needed

## Discovery

1. Open **Discovery**.
2. Edit title, tips (“Good to know”), room, ages, or types if needed.
3. **Approve**
   - **New** → adds an Events **Draft** and stamps **Approved on** = today → Sheet **Last Checked Date** (Verified on Puddles after sync).
   - **Already on site** → updates that Events row’s **Last Checked Date** (does **not** create a duplicate Draft).
4. **Dismiss** items you do not want in the pending queue (saved in this browser).

Refresh the candidate list by running `npm run discover:bay-area` (or a city script) and getting the updated `src/data/discovery-candidates.json` into Admin (local dev, or commit/deploy until live queue refresh exists).

## Events

1. Click **Refresh from Sheet** — updates Admin in this browser only (no deploy).
2. Confirm Drafts and **Last checked** dates.
3. Set **Status = Published** for anything that should appear on the public site.
4. Click **Publish to site** once when ready — syncs `sheet-events.json` and redeploys Netlify (~2–4 min).

Do **not** redeploy after every Approve. Approve already wrote the Sheet.

## Submissions

1. **Refresh** submissions from the Sheet.
2. Update status / approve as usual.
3. Send approved event submissions to the Events tab when ready, then follow the Events steps above.

## When you *do* need a deploy

| Goal | Action |
|------|--------|
| Public site shows new/updated events | **Publish to site** (or wait for sync cron) |
| New Discovery candidates on production Admin | Commit/deploy queue JSON (until Refresh queue exists) |
| New Sheet API actions (Approve, etc.) | Redeploy Apps Script web app (not Netlify) |

## Related docs

- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md)
- [Submissions pipeline](./submissions-pipeline.md)
- [Scheduled sync](./scheduled-sync.md)
