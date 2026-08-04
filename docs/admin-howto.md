# Admin how-to (twice-a-week review)

Quick ops guide for `/admin`. Rule of thumb: **Approve and review in Admin first; Publish to site when the public catalog should update.** Google Sheet writes are optional.

## Typical session

1. **Discovery** (`/admin/discovery`) — review the queue and **Approve** (Ready)
2. **Events** (`/admin/events`) — confirm Drafts / Last checked; set Published
3. **Publish to site** — once at the end when something should go live
4. **Submissions** (`/admin/submissions`) — as needed

## Discovery

1. Open **Discovery**.
2. Edit title, tips (“Good to know”), room, ages, or types if needed.
3. **Approve** (Admin-first — no Sheet required)
   - **New** → marks **Ready**, stamps **Approved on** = today, and adds a **Draft** in Admin Events (this browser).
   - **Already on site** → marks **Ready** and updates that event’s **Last checked** / verified date in Admin (does **not** create a duplicate Draft).
4. Leave **Also write Google Sheet** off unless you still maintain the Sheet. If you turn it on, Sheet failures never undo Ready.
5. **Dismiss** items you do not want in the pending queue (saved in this browser).

Refresh the candidate list by running `npm run discover:bay-area` (or a city script) and getting the updated `src/data/discovery-candidates.json` into Admin (local dev, or commit/deploy until live queue refresh exists).

## Events

1. After Discovery Approve, open **Events** — Drafts and verified dates come from the Admin cache (this browser). **Refresh from Sheet** only if you still pull the Sheet as source of truth (it can overwrite local Drafts).
2. Click **Approve** on a row — sets **Approved on** = today in Admin (and writes Sheet when that path still uses the API).
3. Set **Status = Published** for anything that should appear on the public site.
4. Click **Publish to site** once when ready — syncs `sheet-events.json` and redeploys Netlify (~2–4 min).

Do **not** redeploy after every Approve. Publish once when the public site should change.

## Submissions

1. **Refresh** submissions from the Sheet.
2. Update status / approve as usual.
3. Send approved event submissions to the Events tab when ready, then follow the Events steps above.

## When you *do* need a deploy

| Goal | Action |
|------|--------|
| Public site shows new/updated events | **Publish to site** (or wait for sync cron) |
| New Discovery candidates on production Admin | Commit/deploy queue JSON (until Refresh queue exists) |
| Optional Sheet API actions still in use | Redeploy Apps Script web app (not Netlify) |

## Related docs

- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md)
- [Submissions pipeline](./submissions-pipeline.md)
- [Scheduled sync](./scheduled-sync.md)
