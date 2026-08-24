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
| [MV Special Events](https://www.mountainview.gov/our-city/departments/community-services/special-events) | Partial (all-ages family) | Yes — concerts/movies/festivals | Site blocks scrapers; keep manual |
| [Los Altos Family Fun Days](https://www.losaltosca.gov/329/Family-Fun-Days) | Strong | Yes — Aug 8, Oct 24, Dec 12 | Free 10am–1pm Community Center |
| [Downtown Los Altos](https://downtownlosaltos.org/events/) | Sparse | No | Skip wine/whiskey; add Halloween Trick-or-Treat Oct 30 |
| [CSMA Concerts](https://arts4all.org/concerts/) | Weak | No (concerts) | Evening adult series; watch for family days instead |
| [Linden Tree](https://www.lindentreebooks.com/events-calendar/) | Strong | Partial | Sundays Outdoor Storytime live; **missing author storytimes** Aug–Sep |
| [Home Depot Kids Workshop](https://www.homedepot.com/c/kids-workshop) | Partial (2–5) | Yes — Sep 5, Oct 3 | Monthly builds |
| [OFJCC Jeff Center](https://paloaltojcc.org/the-jeff-center-for-families/) | Strong | Yes — Free Family Play weekdays + Doodle & Discover | Free drop-in play 0–5; Doodle crafts ~2–6 on select Wednesdays |

## Gaps to add next (0–5)

1. **Linden Tree** author storytimes: Aug 9 (Cheng), Aug 16 (Bobrow), Aug 23 (Kim), Aug 30 (Connors), Sep 13 (Fang) — Sundays 10:30am (skip YA/MG).
2. **Downtown Los Altos** — A BOO-tiful Downtown Halloween, Oct 30 (kids trick-or-treat).
3. **OFJCC** — Sep 2 Doodle and Discover (paper bag houses), if not already a separate row.
4. **CSMA** — do not pull `/concerts/` as 0–5; only family-day style posts.

Machine-readable copy: [`data/calendar-watchlist.json`](../data/calendar-watchlist.json).

## Next 2 months

Curated ages 0–5 list (on Puddles + Discovery queue):

- [calendar-watchlist-next-2-months.md](./calendar-watchlist-next-2-months.md)
- [`data/discovery/calendar-watchlist-next-2-months.json`](../data/discovery/calendar-watchlist-next-2-months.json)
