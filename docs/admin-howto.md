# Admin how-to (Thursday review)

Quick ops guide for `/admin`.

**Rule of thumb:** Form → Admin Submissions → Go live. Dashboard Inbox → Add as Draft → header **Deploy**. Discovery still has **Go live** as backup. No Google Sheet required.

## Typical session

1. **Dashboard** (`/admin`) — Inbox Watch / Skip / Add as Draft; Events edits; header **Deploy**
2. **Discovery backup** (`/admin/discovery`) — library queue Approve → **Go live** if Deploy is unavailable
3. **Submissions** (`/admin/submissions`) — Refresh, review new Share form items, **Go live** for Events
4. Wait ~2–4 min for Netlify after Deploy / Go live

## Submissions

1. Parents submit via Share form → lands in **Admin store** automatically (Sheet mirror optional).
2. Open **Submissions** (auto-refreshes) or click **Refresh submissions**.
3. Review details; set status if needed (local-first; syncs to Admin store).
4. For Event submissions, click **Go live** to publish on Puddles (~2–4 min).
5. Mark Ideas / Expansion Watch as **Solved** when done.

Prefer Admin Refresh over Sheet CSV — Sheet fallback can overwrite local review state.

## Discovery

1. Edit if needed → **Approve** / Dashboard **Add** → Draft / Ready.
2. Header **Deploy** on the Dashboard (or Discovery **Go live** as backup) → public catalog.
3. Opening Discovery/Events **syncs lived duplicates** (Draft/Ready/Pending twins of Live are cleared or promoted).
4. Toggle **Regular Discovery** (core cities) vs **Seasonal picks** (Close to home / Worth a little drive). Stage add/remove/move, then **Publish curation** to update the seasonal page (~2–4 min).

**Automation schedule**

| When | What |
|------|------|
| **Sundays @ 8:00 AM PT** | Weekly library queue refresh — new finds added; Approve → Go live still required |
| **Thursdays @ 8:00 AM PT** | Weekly review: core-city weekend search + Worth a little drive / 小紅書 inbox ingest |
| Mid-week | Manual runs, or chat: “search this weekend and next” (core cities) / “fall within an hour” (drive) |

See also [event-discovery.md](./event-discovery.md).

## Events

Monitor and **edit live events** (expand a row → edit → **Save & publish**):

| View | Meaning |
|------|---------|
| **Live** | On the public website |
| **Needs attention** | Live items with review flags |
| **Past** | Schedule has passed |

Sheet refresh / Legacy import are advanced only — they can overwrite Admin edits.

## Related docs

- [Submissions pipeline](./submissions-pipeline.md)
- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md)
- [Scheduled sync](./scheduled-sync.md)
