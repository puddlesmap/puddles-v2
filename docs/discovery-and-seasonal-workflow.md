# Discovery and seasonal workflow

How a find becomes a public listing and (when it fits) a seasonal pick. Human review always; no auto-publish.

Decided October 27, 2026 after the Bray Parade miss and holiday source audit. This page is the operating path. Scripts, cron, and source lists stay in the linked docs.

## Decisions

| Decision | Do | Do not |
| --- | --- | --- |
| **One Publish** | Approve in Admin, then ship once with header **Publish (N)** | Auto-publish scrapes, inboxes, or seasonal sync |
| **Evidence over slugs** | Date, time, and place from the current official page or body | Infer a year or date from a URL, old flyer, or poster |
| **90-day research** | Community / weekend search looks 90 days ahead for one-offs and traditions | Treat mockup “looked” marks as source-check evidence; bulk-mark channels looked |
| **Browse stays 60 days** | Public listings still use the existing display window | Stretch Browse because research looks farther |
| **Watchlist is a planner** | Report due / failed / overdue sources and current-year search queries | Invent an occurrence or mark a source checked without opening it |
| **Seasonal is editorial** | Curate in `seasonalDiscovery.ts`, then `npm run discover:sync-seasonal` | Dump every good activity onto a seasonal page |
| **Core vs drive** | Core cities can Approve → Browse; regional stays Hidden drive | Publish out-of-area farms into regular Browse |

Limits: this improves planning and review. It is not a general web crawler. It does not prove the local branch is deployed.

## One publish button

After review, ship with **Admin header → Publish (N)** once. That runs `publish-admin-bundle` and commits the catalog (+ seasonal curation when staged) to GitHub. Netlify deploys in ~2–4 minutes.

| Step | Where | Outcome |
| --- | --- | --- |
| Find | Watchlist, Wednesday scrape, agent inbox, chat search, street lead | Evidence + official URL (or hold if missing) |
| Queue | `discovery-candidates.json`, core/regional inbox, or direct catalog edit | Row ready for review |
| Approve | **Admin → Discovery** (or **Events**) | **Ready** + staged in publish queue |
| Seasonal (optional) | `seasonalDiscovery.ts` + `npm run discover:sync-seasonal` | Discovery row tagged `Seasonal · …`; collection lists updated |
| Publish | **Publish (N)** in Admin header | Public site + Discovery **Live** where applicable |

Discovery still has a **Go live** action on Ready rows; prefer **Approve → header Publish** when you are batching Discovery, Events, Submissions, and seasonal curation together.

## Find paths

### Library scrape (automated)

Wednesdays @ 8:00 AM PT: `discover:plan-window` picks the horizon prefix (0–30 weekly, 31–60 every two weeks, 61–90 about monthly), then `discover:bay-area` (+ Linden Tree), `discover:core-weekend`, `discover:regional-weekly`. See [event-discovery.md](./event-discovery.md).

### Core cities — weekend search (agent-assisted)

Paste keepers into `data/discovery/core-cities-weekend-inbox.json`, run `npm run discover:core-weekend`. Core cities can publish to regular Browse. [Core cities weekend search](./core-cities-weekend-search.md).

The report lists pending weekend-search rows **and** community source checks due. Opening sources and writing `lastCheck` is a separate human step. Neighborhood traditions (Bray Parade, school carnivals) live here — library scrapers miss them.

### Regional / Worth a little drive

`data/discovery/regional-leads-inbox.json` + `discover:regional-weekly`. Do **not** publish to Browse — Hidden seasonal drive only. [Regional discovery weekly](./regional-discovery-weekly.md).

### Agent discovery inbox

Browser agent POSTs to `/api/discovery-inbox` → `data/discovery/agent-inbox.json`. Admin decides ready / ignored / live. [discovery-inbox.md](./discovery-inbox.md).

### Street lead or tradition (no 2026 event page)

Example: **Halloween Bray Parade** — date from a current posting, contact via host homepage, historical flyer URL for art only (crop off wrong dates).

1. Fact-check what you actually know (time, place, access). Do not copy dates from an old URL slug or poster year.
2. Add a **Published** row in `src/data/sheet-events.json` (or Approve from Discovery if the row came from a scrape).
3. Set `imageUrl` from event or host art; never ship misleading dates on the card image.
4. Update [calendar-watchlist.json](../data/calendar-watchlist.json) (`knownEventPages` / `knownTraditions`, `lastCheck` when verified).
5. If it earns a seasonal module, add the id in [seasonalDiscovery.ts](../src/data/seasonalDiscovery.ts) (`collectionEventIds` and optional `featuredWindows`).
6. Run `npm run discover:sync-seasonal` so Admin → Discovery **Seasonal picks** shows the row.
7. Review on `/seasonal/{slug}`, **Admin → Seasonal calendar → Review events**, and Discovery seasonal filter.
8. **Publish (N)** when the deploy list looks right.

## Seasonal picks ↔ Discovery pipeline

**Source of truth for picks:** `src/data/seasonalDiscovery.ts` (`collectionEventIds`, `driveEventIds`, `featuredWindows`).

**Pipeline map:** `src/utils/seasonalDiscoveryPipeline.ts` (Hello Fall, Halloween, Holiday magic).

| Command | What |
| --- | --- |
| `npm run discover:sync-seasonal` | Mirror every curated pick into `discovery-candidates.json` with tags `Seasonal · {theme} · {collection\|drive\|featured}` |

Holiday magic close/drive lists use `HOLIDAY_MAGIC_CLOSE_EVENT_IDS` / `HOLIDAY_MAGIC_DRIVE_EVENT_IDS`; editorial rows live in `seasonalHolidayMagicEvents.ts` and are included in the sync script.

After sync, filter **Admin → Discovery → Seasonal picks** to review copy, images, and placement before publish.

Home shows a **Coming next** card (green Holiday magic treatment) in the 14 days before that theme’s `activeFrom`. The live theme band is separate.

## Watchlist research (does not publish by itself)

`npm run discover:core-weekend` appends a **Community source checks due** section from `watchlistDiscoveryPlan.mjs` (90-day horizon, `knownTraditions` search queries). Failed fetches stay failures. Historical pages are leads, never current dates.

## Examples from the Oct 27 pass

| Example | Theme | Notes |
| --- | --- | --- |
| **Halloween Bray Parade** (Oct 31, Bol Park) | Halloween | Street lead; `eventUrl` = Barron Park homepage; poster cropped to remove 2023 date |
| **Los Altos Festival of Lights Parade** (Nov 29) | Holiday magic | Verified on [losaltosparade.org/welcome](https://www.losaltosparade.org/welcome) |
| **Holiday Bazaar** (MV Senior Center) | — | Hidden from Browse (55+ vendor fair, no child activity) |
| **Little Gym Parent Survival Nights** | Browse **Classes** only | Drop-off; not Holiday magic editorial |

Holiday research shortlist and holds: [holiday-curation-and-source-audit-2026-10-27.md](./holiday-curation-and-source-audit-2026-10-27.md).

## Related

- [Admin how-to](./admin-howto.md) — typical Wednesday session
- [Event discovery](./event-discovery.md) — scripts, cron, scrape details
- [Core cities weekend search](./core-cities-weekend-search.md) — 90-day one-off window
- [Pre-deploy review](../.cursor/rules/pre-deploy-review.mdc) — confirm list before push
