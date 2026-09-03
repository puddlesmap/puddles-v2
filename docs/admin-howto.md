# Admin how-to (twice-a-week review)

Quick ops guide for `/admin`.

**Rule of thumb:** Form → Admin Submissions → Go live. Discovery → Approve → Go live. Events monitors Live / Needs attention / Past. No Google Sheet required.

## Typical session

1. **Submissions** (`/admin/submissions`) — Refresh, review new Share form items, **Go live** for Events
2. **Discovery** (`/admin/discovery`) — Approve library candidates, **Go live**
3. **Events** (`/admin/events`) — Monitor Live / Needs attention / Past
4. Wait ~2–4 min for Netlify after Go live

## Submissions

1. Parents submit via Share form → lands in **Admin store** automatically (Sheet mirror optional).
2. Open **Submissions** (auto-refreshes) or click **Refresh submissions**.
3. Review details; set status if needed (local-first; syncs to Admin store).
4. For Event submissions, click **Go live** to publish on Puddles (~2–4 min).
5. Mark Ideas / Expansion Watch as **Solved** when done.

Prefer Admin Refresh over Sheet CSV — Sheet fallback can overwrite local review state.

## Discovery

1. Edit if needed → **Approve** → Ready.
2. **Go live** on Ready items → public catalog.

**Automation schedule**

| When | What |
|------|------|
| **Sundays @ 8:00 AM PT** | Weekly queue refresh — new finds added; Approve → Go live still required |
| **Fridays @ 8:00 AM PT** | Regional pass for Worth a little drive highlights |
| Mid-week | Manual runs only |

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
