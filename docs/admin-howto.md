# Admin how-to (twice-a-week review)

Quick ops guide for `/admin`. Rule of thumb: **Approve in Discovery, Go live to update the public site. Events is for monitoring.**

## Typical session

1. **Discovery** (`/admin/discovery`) — review the queue and **Approve** (Ready)
2. **Go live** on Ready items — publishes to the public catalog (~2–4 min)
3. **Events** (`/admin/events`) — monitor **Live**, **Needs attention**, and **Past**
4. **Submissions** (`/admin/submissions`) — as needed

## Discovery

1. Open **Discovery**.
2. Edit title, tips (“Good to know”), room, ages, or types if needed.
3. **Approve** → status becomes **Ready**, **Approved on** = today (saved in this browser).
4. On the **Ready** filter, click **Go live** (selected rows or “Go live all Ready”).
   - Marks activities **Published** and commits them to `sheet-events.json` (no Google Sheet required).
   - Items move to the **Live** Discovery filter after success.
5. Leave **Also write Google Sheet** off unless you still maintain the Sheet.

Refresh the candidate list by running `npm run discover:bay-area` (or a city script) and getting the updated `src/data/discovery-candidates.json` into Admin (local dev, or commit/deploy until live queue refresh exists).

## Events

Events is a **monitor**, not a Draft pipeline:

| View | Meaning |
|------|---------|
| **Live** | On the public website now |
| **Needs attention** | Live items with review flags (duplicates, age, area, mismatches) |
| **Past** | Schedule has passed |

Sheet **Refresh** / **Sync Sheet to site** are advanced/legacy. Prefer Discovery **Go live** to update the public site.

## Submissions

1. **Refresh** submissions from the Sheet.
2. Update status / approve as usual.
3. Send approved event submissions toward Events when ready, then use Discovery Go live or Sheet sync as appropriate.

## When you *do* need a deploy

| Goal | Action |
|------|--------|
| Public site shows newly approved Discovery items | **Discovery → Go live** |
| Re-pull everything from Google Sheet | Events → Sync Sheet to site (advanced) |
| New Discovery candidates on production Admin | Commit/deploy queue JSON (until Refresh queue exists) |

## Related docs

- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md)
- [Submissions pipeline](./submissions-pipeline.md)
- [Scheduled sync](./scheduled-sync.md)
