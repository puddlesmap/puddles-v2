# Expansion discovery lookahead

Window: **2026-10-29 → 2027-01-27** (90 days)

Generated 2026-10-29T23:52:04.483Z

## Launch expansion targets

| Target | In window (discovery queue) | Pending review | On live catalog |
|--------|----------------------------|----------------|-----------------|
| **Sunnyvale** (new city) | 2 | 1 | 8 |
| **Parent & Me** (new type) | 1 | 1 | 0 |
| **Festivals & Community** (new type) | 17 | 7 | 20 |

## By city (discovery queue, in window)

| City | Total | New for review |
|------|-------|----------------|
| Palo Alto | 76 | 14 |
| Mountain View | 35 | 5 |
| Los Altos | 23 | 6 |
| San Carlos | 3 | 3 |
| Oakland | 3 | 3 |
| Sunnyvale | 2 | 1 |
| Sausalito | 2 | 2 |
| Los Altos Hills | 1 | 0 |
| Woodside | 1 | 0 |

## By activity type (discovery queue, in window)

| Type | Count |
|------|-------|
| Stories | 85 |
| Build & Explore | 23 |
| Festivals & Community | 17 |
| Outdoor | 17 |
| Other | 12 |
| Music & Movement | 6 |
| Arts & Crafts | 4 |
| Social & Play | 2 |
| Parent & Me | 1 |

## Sunnyvale — pending review

| Date | Event | Source | Status |
|------|-------|--------|--------|
| 2026-11-03 | Sunnyvale Recreation · Fall Parent & Me & preschool classes | Core cities · Weekend search · agent | pending |

## Parent & Me — pending review (in window)

| Date | City | Event | Source |
|------|------|-------|--------|
| 2026-11-03 | Sunnyvale | Sunnyvale Recreation · Fall Parent & Me & preschool classes | Core cities · Weekend search · agent |

## Festivals & Community — pending review (in window)

| Date | City | Event | Source |
|------|------|-------|--------|
| 2026-10-30 | Los Altos | Fall Family Fun / Trunk-or-Treat | Core cities · Weekend search · agent |
| 2026-10-31 | Mountain View | Mountain View Library Halloween Trick-or-Treat | Core cities · Weekend search · agent |
| 2026-12-05 | Oakland | GIFTY Holiday Craft Fair & Open House | Regional · Lead · agent |
| 2026-12-05 | Palo Alto | Magical Santa Dance Party | Core cities · Weekend search · agent |
| 2026-12-12 | Oakland | Fairy Winterland | Regional · Lead · agent |
| 2026-12-31 | Sausalito | Noon Year's Eve | Regional · Lead · agent |
| 2026-12-31 | Oakland | Countdown in Wonderland | Regional · Lead · agent |

## Calendar watchlist — grouped sources

### city-community

Checked this pass: 1/8

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Google Visitor Experience | Mountain View | monthly | — |
| City of Sunnyvale · Special Events | Sunnyvale | monthly | checked (1) |
| Downtown Sunnyvale · Cityline & Murphy Ave | Sunnyvale | monthly | — |
| Mountain View Special Events | Mountain View | weekly in season | — |
| Los Altos Family Fun Days | Los Altos | seasonal | — |
| Downtown Los Altos Events | Los Altos | monthly | — |
| Home Depot Kids Workshop | Palo Alto | monthly | — |
| Elizabeth F. Gamble Garden | Palo Alto | seasonal | — |

### parent-me-providers

Checked this pass: 0/9

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Sunnyvale Recreation · Parent & Tot | Sunnyvale | seasonal | — |
| Oshman Family JCC · Jeff Center for Families | Palo Alto | weekly | — |
| Marti Foster Yoga · Parent & Baby | Mountain View | weekly | — |
| Music Together Menlo Park & Palo Alto | Palo Alto | semester | — |
| Mini Yoga Club | Sunnyvale | monthly | — |
| FIT4MOM Silicon Valley Central | Palo Alto | weekly Wednesdays | — |
| Otto Family Club | Sunnyvale | monthly | — |
| Talo Yoga · CircleMoms host | Palo Alto | semester | — |
| Sunnyvale Recreation · Fall/Winter Activities Guide | Sunnyvale | seasonal | — |

### libraries-bookstores

Checked this pass: 0/2

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Sunnyvale Public Library · Kids Events | Sunnyvale | weekly | — |
| Linden Tree Books | Los Altos | weekly | — |

### music-dance

Checked this pass: 1/3

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| CSMA Concerts | Mountain View | as needed | — |
| Symphony San Jose · My Very First | San Jose | seasonal | — |
| SFJAZZ · Family Matinees | San Francisco | seasonal | no-new-events (0) |

### museums-attractions

Checked this pass: 2/3 · gaps: 1

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Los Altos History Museum | Los Altos | seasonal | — |
| Children’s Discovery Museum of San Jose | San Jose | seasonal | no-new-events (0) |
| The Tech Interactive | San Jose | seasonal | review-needed (0) |

### performances-theatre

Checked this pass: 2/2

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Peninsula Youth Theatre · Stories on Stage | Mountain View | monthly | checked (0) |
| Stanford Live | Palo Alto | as needed | no-new-events (0) |

### nature-seasonal

Checked this pass: 1/5

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Lemos Farm | Half Moon Bay | seasonal | — |
| East Bay Regional Parks · Garin Apple Festival | Hayward | annual | — |
| Roaring Camp Railroads | Felton | annual | — |
| Filoli · Seasonal Experiences | Woodside | seasonal | checked (1) |
| Deer Hollow Farm | Cupertino | seasonal | — |

### museums-destinations

Checked this pass: 0/3

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Hiller Aviation Museum · Family programs | San Carlos | monthly | — |
| Bay Area Discovery Museum | Sausalito | seasonal | — |
| Children's Fairyland | Oakland | seasonal | — |

### roundup-web

Checked this pass: 0/3

| Source | City | Cadence | Last check |
|--------|------|---------|------------|
| Bay Area Kid Fun (roundup) | Bay Area | monthly | — |
| 510 Families (roundup) | East Bay | monthly | — |
| Marin Mommies (roundup) | Marin | monthly | — |


## Gaps & next actions

- **Sunnyvale library:** No automated Sunnyvale branch scraper — add `discover-sunnyvale.mjs` or keep `build-launch-staging.mjs` series seeds current.
- **Parent & Me:** Re-check FIT4MOM weekly graphic (Mondays), Marti Foster, Music Together semester row.
- **Seasonal drive picks:** Editorial farms/haunts live in `seasonal*DriveEvents.ts` — not library scrapers.
- **Core cities only in regular discovery:** Events outside Palo Alto / Los Altos / Mountain View belong in Seasonal → Worth a Little Drive until a city landing justifies a scraper.

## Ops

- Review queue: `/admin/discovery`
- Launch review: `/experiment/seasonal-launch-review`
- Refresh libraries: `npm run discover:bay-area -- --days=90`
- Regenerate this report: `npm run discover:expansion-lookahead`

