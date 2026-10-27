# Admin how-to (Wednesday review)

Quick ops guide for `/admin`.

**Rule of thumb:** Review each item → **Approve** or **Remove** → use the header **Publish** once for all approved Admin changes. No Google Sheet required.

## Typical session

1. **Review** (`/admin`) — new finds, plus **Needs a look** for drafts, field problems, and stale Last checked dates
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
2. Approved events join the shared header Publish summary; there is no item-level publish.
3. Events 61–90 days away remain stored internally until review becomes timely. Registration or material updates can bring them into Review sooner.
4. Seasonal add/remove/move actions remain staged and join the same Publish summary.

**Seasonal picks**

1. Curate ids in `src/data/seasonalDiscovery.ts` (close to home / worth a drive / featured windows).
2. Run `npm run discover:sync-seasonal` so Discovery rows pick up `Seasonal · …` tags.
3. Filter Discovery by **Seasonal picks**, or open **Seasonal calendar → Review events** (Hello Fall, Halloween, Holiday magic).
4. Include seasonal + catalog changes in the same **Publish (N)** when ready.

**Street lead or tradition (no event page)** — fact-check the current occurrence, edit `sheet-events.json` + watchlist, add to seasonal lists if earned, sync seasonal Discovery, then Publish. Details: [discovery-and-seasonal-workflow.md](./discovery-and-seasonal-workflow.md).

**Automation schedule**

| When | What |
|------|------|
| **Wednesdays @ 8:00 AM PT** | Library, core-city weekend, and Worth a little drive sources merge into the unified Discovery Inbox. |
| Mid-week | Manual runs, or chat: “search this weekend and next” (core cities) / “fall within an hour” (drive) |

See also [event-discovery.md](./event-discovery.md).

## Events

Monitor live and past listings. Expand a row to edit; saving stages the change for the header Publish and sets Last checked to that day. Cancel or remove a live listing from the row. Drafts, field problems, and stale Last checked dates are on **Review**, under **Needs a look**.

| View | Meaning |
|------|---------|
| **Live** | Already on the public site and not past |
| **Past** | The date has passed |

Sheet refresh / Legacy import are advanced only — they can overwrite Admin edits.

## Social Studio

`/admin/social` reviews finished slide packs. **Approve** does not post to Instagram. On this Mac it saves the slides and captions into `Documents/Projects/Puddles WIP/_Instagram/2_weekly highllight/` and updates the Notion content calendar. On the live site the Mac folder does not exist, so Approve still updates Notion and leaves the folder for a local approve. Set `NOTION_TOKEN` on Netlify for that live calendar write.

Halloween Part 1 lands in `halloween-1010-17/` (`01.png`…, `caption.txt`, `xiaohongshu.txt`). Halloween Part 2 lands in `halloween-1024-31/`. Other approved items get a folder named for that item.

Starting Friday, Oct 16, 2026, the next weekend pack is created in Social Studio as drafts first. It is not copied into the weekly folder until you approve it. The first pack that cadence produces is the Oct 17–18 weekend. A weekday pack for the following week is drafted too. Times are Pacific.

- **Weekend pack:** Weekend Highlights carousel (Thu 12pm), Planning the Weekend story (Thu 4pm), Xiaohongshu weekend post (Thu 7pm), Friday reminder (7pm), Saturday Today’s Picks (8:30am), and an optional Sunday story (8:30am).
- **Weekday pack:** Weekday Highlights carousel (Sun 7pm), Xiaohongshu weekday post (Sun 8pm), Monday reminder (9am), and an optional Wednesday story (8:30am).

Auto-post is a later step.

Manual stories and 小紅書 stay with you. The publisher still only sends items whose status is Scheduled, and nothing in this review flow sets that status.

Instagram keys, when auto-post is built later, stay out of the repo: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, and `INSTAGRAM_REDIRECT_URI` (`https://puddlesmap.com/api/instagram-oauth`).

## Related docs

- [Submissions pipeline](./submissions-pipeline.md)
- [Discovery and seasonal workflow](./discovery-and-seasonal-workflow.md) — decisions, find paths, seasonal sync
- [Event discovery](./event-discovery.md)
- [Sheet publishing](./sheet-publishing.md)
- [Scheduled sync](./scheduled-sync.md)
