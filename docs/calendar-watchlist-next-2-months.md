# Expansion discovery lookahead

Window: **2026-11-03 → 2027-02-01** (90 days)

Generated 2026-11-03T20:21:06.693Z

## Launch expansion targets

| Target | In window (discovery queue) | Pending review | On live catalog |
|--------|----------------------------|----------------|-----------------|
| **Sunnyvale** (new city) | 1 | 1 | 0 |
| **Parent & Me** (new type) | 1 | 1 | 0 |
| **Festivals & Community** (new type) | 12 | 7 | 3 |

## By city (discovery queue, in window)

| City | Total | New for review |
|------|-------|----------------|
| Palo Alto | 71 | 30 |
| Mountain View | 33 | 21 |
| Los Altos | 20 | 6 |
| San Carlos | 3 | 3 |
| Oakland | 3 | 3 |
| Sausalito | 2 | 2 |
| Sunnyvale | 1 | 1 |
| Los Altos Hills | 1 | 0 |
| Woodside | 1 | 0 |

## By activity type (discovery queue, in window)

| Type | Count |
|------|-------|
| Stories | 83 |
| Build & Explore | 22 |
| Outdoor | 15 |
| Festivals & Community | 12 |
| Other | 11 |
| Music & Movement | 6 |
| Arts & Crafts | 4 |
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
| 2026-12-05 | Oakland | GIFTY Holiday Craft Fair & Open House | Regional · Lead · agent |
| 2026-12-05 | Palo Alto | Magical Santa Dance Party | Core cities · Weekend search · agent |
| 2026-12-12 | Oakland | Fairy Winterland | Regional · Lead · agent |
| 2026-12-19 | Palo Alto | Celebrating Yalda Night | Palo Alto Library · BiblioCommons |
| 2026-12-31 | Sausalito | Noon Year's Eve | Regional · Lead · agent |
| 2026-12-31 | Oakland | Countdown in Wonderland | Regional · Lead · agent |
| 2026-12-31 | Palo Alto | Noon Year's Eve Celebration! | Palo Alto Library · BiblioCommons |

## Calendar watchlist — manual checks

| Source | City | Cadence | Fit | On Puddles? |
|--------|------|---------|-----|-------------|
| Google Visitor Experience | Mountain View | monthly | partial | No |
| City of Sunnyvale · Special Events | Sunnyvale | monthly | partial | Yes |
| Downtown Sunnyvale · Cityline & Murphy Ave | Sunnyvale | monthly | partial | No |
| Sunnyvale Recreation · Parent & Tot | Sunnyvale | seasonal | strong | No |
| Sunnyvale Public Library · Kids Events | Sunnyvale | weekly | strong | No |
| Mountain View Special Events | Mountain View | weekly in season | partial | Yes |
| Los Altos Family Fun Days | Los Altos | seasonal | strong | Yes |
| Downtown Los Altos Events | Los Altos | monthly | sparse | No |
| CSMA Concerts | Mountain View | as needed | weak | No |
| Los Altos History Museum | Los Altos | seasonal | partial | Yes |
| Linden Tree Books | Los Altos | weekly | strong | Yes |
| Home Depot Kids Workshop | Palo Alto | monthly | partial | Yes |
| Oshman Family JCC · Jeff Center for Families | Palo Alto | weekly | strong | Yes |
| Peninsula Youth Theatre · Stories on Stage | Mountain View | seasonal | strong | No |
| Elizabeth F. Gamble Garden | Palo Alto | monthly | partial | Yes |
| Marti Foster Yoga · Parent & Baby | Mountain View | weekly | strong | No |
| Music Together Menlo Park & Palo Alto | Palo Alto | semester | strong | No |
| Mini Yoga Club | Sunnyvale | monthly | strong | No |
| FIT4MOM Silicon Valley Central | Palo Alto | weekly Mondays | strong | No |
| Talo Yoga · CircleMoms host | Palo Alto | semester | partial | No |
| Lemos Farm | Half Moon Bay | seasonal | strong | Yes |
| East Bay Regional Parks · Garin Apple Festival | Hayward | annual | strong | Yes |
| Roaring Camp Railroads | Felton | annual | strong | Yes |
| IPA USA California | Palo Alto | weekly | strong | Yes |
| The Village at San Antonio Center | Mountain View | monthly | partial | Yes |
| AAH Smile Farm | Sunnyvale | monthly | strong | Yes |
| City of Palo Alto · Events Directory | Palo Alto | weekly | partial | No |
| Patchen Christmas Tree & Pumpkin Farm | Los Gatos | seasonal | strong | No |
| LARPD Applefest at Ravenswood | Livermore | annual | strong | No |
| Ag Day at Meek Park | Hayward | annual | strong | No |
| Hidden Villa | Los Altos Hills | weekly | strong | No |
| Gizdich Ranch | Watsonville | seasonal | strong | No |

## Gaps & next actions

- **Sunnyvale library:** No automated Sunnyvale branch scraper — add `discover-sunnyvale.mjs` or keep `build-launch-staging.mjs` series seeds current.
- **Parent & Me:** Re-check FIT4MOM weekly graphic (Mondays), Marti Foster, Music Together semester row.
- **Seasonal drive picks:** Editorial farms/haunts live in `seasonal*DriveEvents.ts` — not library scrapers.
- **Core cities only in regular discovery:** Events outside Palo Alto / Los Altos / Mountain View belong in Seasonal → Worth a Little Drive until a city landing justifies a scraper.

## Ops

- Review queue: `/admin/discovery`
- Launch review: `/experiment/seasonal-launch-review`
- Refresh libraries: `npm run discover:bay-area -- --days=90`
- Weekend web/social (core cities): `npm run discover:core-weekend`
- Weekend Worth a Drive (~1 hour): `npm run discover:regional-weekly`
- Regenerate this report: `npm run discover:expansion-lookahead`

