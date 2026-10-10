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
3. Opening Discovery/Events **syncs lived duplicates** (Draft/Ready/Pending twins of Live are cleared or promoted).
4. Toggle **Regular Discovery** (core cities) vs **Seasonal picks** (Close to home / Worth a little drive). Stage add/remove/move, then **Publish curation** to update the seasonal page (~2–4 min).

**Automation schedule**

| When | What |
|------|------|
| **Wednesdays @ 8:00 AM PT** | Library queue refresh and the Worth a little drive pass. Approve → Go live still required. Sunnyvale library and FIT4MOM are a browser check, shown on Admin as still to check. |
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

## Social Studio

`/admin/social` reviews finished slide packs. **Approve** does not post to Instagram. On this Mac it saves the slides and captions into `Documents/Projects/Puddles WIP/_Instagram/2_weekly highllight/` and updates the Notion content calendar. On the live site the Mac folder does not exist, so Approve still updates Notion and leaves the folder for a local approve. Set `NOTION_TOKEN` on Netlify for that live calendar write.

Halloween Part 1 lands in `halloween-1010-17/` (`01.png`…, `caption.txt`, `xiaohongshu.txt`). Halloween Part 2 lands in `halloween-1024-31/`. Other approved items get a folder named for that item.

Starting Friday, Oct 16, 2026, the next weekend pack is created in Social Studio as drafts first. It is not copied into the weekly folder until you approve it. The first pack that cadence produces is the Oct 17–18 weekend. Auto-post is a later step.

Manual stories and 小紅書 stay with you. The publisher still only sends items whose status is Scheduled, and nothing in this review flow sets that status.

Instagram keys, when auto-post is built later, stay out of the repo: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, and `INSTAGRAM_REDIRECT_URI` (`https://puddlesmap.com/api/instagram-oauth`).

## Related docs

- [Submissions pipeline](./submissions-pipeline.md)
- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md)
- [Scheduled sync](./scheduled-sync.md)
