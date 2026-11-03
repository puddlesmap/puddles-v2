# Admin how-to (Wednesday review)

Quick ops guide for `/admin`.

**Rule of thumb:** Review each item → **Approve** or **Remove** → use the header **Publish** once for all approved Admin changes. No Google Sheet required.

## Typical session

1. **Review** (`/admin`) — new finds, plus **Needs a look** for drafts and field problems
2. **Events / Submissions / Seasonal** — approve edits, submissions, and staged curation
3. Open header **Publish (N)** and confirm the grouped change summary
4. Publish once, then wait ~2–4 min for the single Netlify update

## Submissions

1. Parents submit via Share form → lands in **Admin store** automatically (Sheet mirror optional).
2. Open **Submissions** (auto-refreshes) or click **Refresh submissions**.
3. Review details; set status if needed (local-first; syncs to Admin store).
4. For Event submissions, click **Approve**. It joins the header Publish summary.
5. Use **Remove** for submissions that do not belong on Puddles.

Prefer Admin Refresh over Sheet CSV — Sheet fallback can overwrite local review state.

## Discovery

1. Edit if needed, then choose **Approve** or **Remove**.
2. Approved events join the shared header **Publish** summary; there is no per-row publish on Review.
3. **Awaiting Publish** tab lists approved rows still waiting on header Publish.
4. Last edits before publish: **Approved** nav.
5. Seasonal add/remove/move actions remain staged and join the same Publish summary.

**Seasonal picks**

1. Curate ids in `src/data/seasonalDiscovery.ts` (close to home / worth a drive / featured windows).
2. Run `npm run discover:sync-seasonal` so Discovery rows pick up `Seasonal · …` tags.
3. Filter Discovery by **Seasonal picks**, or open **Seasonal calendar → Review events** (Hello Fall, Halloween, Holiday magic).
4. Include seasonal + catalog changes in the same **Publish (N)** when ready.

**Automation schedule**

| When | What |
|------|------|
| **Wednesdays @ 8:00 AM PT** | Unified ingest (libraries, inboxes, merge) |
| **Sundays @ 8:00 AM PT** | Weekly library queue refresh — Approve → Publish still required |

See also [event-discovery.md](./event-discovery.md).

**Manual checklist (weekly sources)**

- **Open all this week** in Admin only opens links in *your* browser — it does not scrape or add rows.
- Preferred: in Cursor chat, ask the agent to open the same URLs in the **Editor browser**, scrape, and merge with `node scripts/merge-manual-checklist-scrape.mjs data/discovery/manual-checklist-scrape-*.json`.
- Checkboxes on the checklist mark “looked” in localStorage only.

## Events

Monitor and **edit live events** (expand a row → edit → stage for header Publish):

| View | Meaning |
|------|---------|
| **Live** | On the public site today |
| **Drafts** | Local Admin cache; not public until Publish |
| **Needs attention** | Live rows flagged for review |
