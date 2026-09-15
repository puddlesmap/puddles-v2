# Calendar Watchlist

The saved list of **non-library calendars** Puddles checks for ages 0–5 activities.

## Naming

| Avoid | Prefer | Why |
|-------|--------|-----|
| Event library | **Calendar Watchlist** | “Library” collides with public libraries and the live Events catalog |
| Source library | **Community calendars** (parent-facing) | Clearer for humans; Watchlist is the ops name |

- **Events catalog** = what’s live/draft on the site (Sheet → `sheet-events.json`)
- **Discovery** = automated library scrapers (BiblioCommons / LibCal → Admin queue)
- **Calendar Watchlist** = manual/partner feeds you revisit on a cadence (`data/calendar-watchlist.json`)

## Sources (Aug 2026 pass)

| Source | 0–5 fit | On Puddles? | Notes |
|--------|---------|-------------|--------|
| [MV Special Events](https://www.mountainview.gov/our-city/departments/community-services/special-events) | Partial (all-ages family) | Yes — concerts/movies/festivals | Site blocks scrapers; keep manual. **Harvest History Festival** (Sep 26, Heritage Park) is live — marketing page `/harvest-history-festival` aliases to calendar Event/3482 in discovery dedupe. |
| [Los Altos Family Fun Days](https://www.losaltosca.gov/329/Family-Fun-Days) | Strong | Yes — Aug 8, Oct 24, Dec 12 | Free 10am–1pm Community Center |
| [Downtown Los Altos](https://downtownlosaltos.org/events/) | Sparse | No | Skip wine/whiskey; add Halloween Trick-or-Treat Oct 30 |
| [CSMA Concerts](https://arts4all.org/concerts/) | Weak | No (concerts) | Evening adult series; watch for family days instead |
| [Linden Tree](https://www.lindentreebooks.com/events-calendar/) | Strong | Yes | **Weekly Sunday scrape** (`npm run discover:linden-tree`, Sunday cron). Standing Outdoor Storytime 10:30am + named author storytimes. Skip YA/MG. Host image = store logo. |
| [Gamble Garden](https://www.gamblegarden.org/events/category/kids/) | Partial | Yes — Second Saturday | Monthly kids morning (storytime, hunt, craft). Parent & Me Yoga is ages 4–8. |
| [IPA USA CA](https://www.instagram.com/ca.ipa.usa/) | Strong | Yes — National Day of Play | Instagram pop-up playdates. Weekly in September. |
| [Village at San Antonio](https://villageatsanantoniocenter.com/events/) | Partial | Yes — foam / play socials | Second Saturday park events; skip adult concerts. |
| [AAH Smile Farm](https://www.aahsmilefarm.org/) | Strong | Yes — ticketed farm days | Baylands Park, Sunnyvale. |
| [Palo Alto Events Directory](https://www.paloalto.gov/Events-Directory) | Partial | Mixed | Weekend web-search starting point; not a single scrape. |
| [Patchen Pumpkin Patch](https://patchencalifornia.com/pumpkin/) | Strong | No | Los Gatos. 2026 season Sep 18–Oct 25. Worth a Drive — skip Harvest Nights wine set. |
| [LARPD Applefest](https://www.larpd.org/2026-09-13-applefest) | Strong | No | Livermore Ravenswood. Annual cider/orchard morning. |
| [HARD Ag Day](https://www.haywardrec.org/2083/Ag-Day-at-Meek-Park) | Strong | No | Meek Park, Hayward. Free farm animals & hands-on ag. |
| [Hidden Villa](https://www.hiddenvilla.org/programs/individuals-families/) | Strong | No | Los Altos Hills. Confirm weekend farm tours before adding — catalog vs family page have disagreed. |
| [Gizdich Ranch](https://www.gizdich-ranch.com/u-pick) | Strong | No | Watsonville apple u-pick (borderline ~1 hour). Confirm hours on the official page. |
| [Home Depot Kids Workshop](https://www.homedepot.com/c/kids-workshop) | Partial (2–5) | Yes — Sep 5, Oct 3 | Monthly builds |
| [OFJCC Jeff Center](https://paloaltojcc.org/the-jeff-center-for-families/) | Strong | Yes — Free Family Play weekdays + Doodle & Discover | Free drop-in play 0–5; Doodle crafts ~2–6 on select Wednesdays |

## Gaps to add next (0–5)

1. **Downtown Los Altos** — A BOO-tiful Downtown Halloween, Oct 30 (kids trick-or-treat).
2. **OFJCC** — Sep 2 Doodle and Discover (paper bag houses), if not already a separate row.
3. **CSMA** — do not pull `/concerts/` as 0–5; only family-day style posts.

### Linden Tree (automated weekly)

- Cron: Sunday with bay-area discovery — `npm run discover:linden-tree`
- Source: [events calendar](https://www.lindentreebooks.com/events-calendar/)
- Standing: Outdoor Storytime every Sunday 10:30am
- Also queues named author picture-book storytimes; Admin **Approve → Go live** for new rows

### Weekend web & social (core cities)

Library scrapers miss Instagram pop-ups and one-off play days. **Thursday cron** + chat: [Core cities — weekend search](./core-cities-weekend-search.md). Inbox: `data/discovery/core-cities-weekend-inbox.json`. Command: `npm run discover:core-weekend`.

### Weekend web & social (~1 hour drive)

Pumpkin patches, apple days, and harvest festivals outside the four cities. **Thursday cron** + chat: [Regional — weekend Worth a Drive search](./regional-weekend-drive-search.md). Inbox: `data/discovery/regional-leads-inbox.json`. Command: `npm run discover:regional-weekly`. Do not Go live — Hidden Worth a Drive only.


Machine-readable copy: [`data/calendar-watchlist.json`](../data/calendar-watchlist.json).

## Next 2 months

Curated ages 0–5 list (on Puddles + Discovery queue):

- [calendar-watchlist-next-2-months.md](./calendar-watchlist-next-2-months.md)
- [`data/discovery/calendar-watchlist-next-2-months.json`](../data/discovery/calendar-watchlist-next-2-months.json)
