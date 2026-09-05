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
| [Linden Tree](https://www.lindentreebooks.com/events-calendar/) | Strong | Yes | **Weekly Sunday scrape** (`npm run discover:linden-tree`, Sunday cron). Standing Outdoor Storytime 10:30am + named author storytimes. Skip YA/MG. Host image = homepage staff banner. |
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


Machine-readable copy: [`data/calendar-watchlist.json`](../data/calendar-watchlist.json).

## Next 2 months

Curated ages 0–5 list (on Puddles + Discovery queue):

- [calendar-watchlist-next-2-months.md](./calendar-watchlist-next-2-months.md)
- [`data/discovery/calendar-watchlist-next-2-months.json`](../data/discovery/calendar-watchlist-next-2-months.json)
