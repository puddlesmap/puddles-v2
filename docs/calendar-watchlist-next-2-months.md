# Expansion discovery lookahead

Window: **2026-09-06 → 2026-12-05** (90 days)

Generated 2026-09-06T17:30:38.132Z

## Launch expansion targets

| Target | In window (discovery queue) | Pending review | On live catalog |
|--------|----------------------------|----------------|-----------------|
| **Sunnyvale** (new city) | 8 | 0 | 32 |
| **Parent & Me** (new type) | 7 | 0 | 7 |
| **Festivals & Community** (new type) | 22 | 0 | 15 |

## By city (discovery queue, in window)

| City | Total | New for review |
|------|-------|----------------|
| Palo Alto | 114 | 9 |
| Mountain View | 55 | 3 |
| Los Altos | 21 | 0 |
| Sunnyvale | 8 | 0 |
| Hayward | 2 | 0 |
| San Francisco | 2 | 0 |
| Gilroy | 2 | 0 |
| San Jose | 2 | 0 |
| Morgan Hill | 1 | 0 |
| Nicasio | 1 | 0 |
| Redwood City | 1 | 0 |
| Half Moon Bay | 1 | 0 |
| Fremont | 1 | 0 |

## By activity type (discovery queue, in window)

| Type | Count |
|------|-------|
| Stories | 137 |
| Outdoor | 36 |
| Build & Explore | 29 |
| Festivals & Community | 22 |
| Social & Play | 9 |
| Arts & Crafts | 8 |
| Parent & Me | 7 |
| Other | 5 |
| Music & Movement | 4 |

## Sunnyvale — pending review

_No Sunnyvale rows in window — check watchlist (Mini Yoga, FIT4MOM) and library seeds._

## Parent & Me — pending review (in window)

_None — re-check FIT4MOM schedule, Marti Foster, Music Together, yoga studios._

## Festivals & Community — pending review (in window)

_None — check city special events, harvest/Halloween fairs, open houses._

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
| Elizabeth F. Gamble Garden | Palo Alto | seasonal | partial | No |
| Marti Foster Yoga · Parent & Baby | Mountain View | weekly | strong | No |
| Music Together Menlo Park & Palo Alto | Palo Alto | semester | strong | No |
| Mini Yoga Club | Sunnyvale | monthly | strong | No |
| FIT4MOM Silicon Valley Central | Palo Alto | weekly Mondays | strong | No |
| Talo Yoga · CircleMoms host | Palo Alto | semester | partial | No |
| Lemos Farm | Half Moon Bay | seasonal | strong | Yes |
| East Bay Regional Parks · Garin Apple Festival | Hayward | annual | strong | Yes |
| Roaring Camp Railroads | Felton | annual | strong | Yes |

## Gaps & next actions

- **Sunnyvale:** No pending library rows — Sunnyvale Public Library is watchlist-only until `discover-sunnyvale.mjs` exists; verify Mini Yoga Club + FIT4MOM Las Palmas + library seeds.
- **Sunnyvale library:** No automated Sunnyvale branch scraper — add `discover-sunnyvale.mjs` or keep `build-launch-staging.mjs` series seeds current.
- **Parent & Me:** Re-check FIT4MOM weekly graphic (Mondays), Marti Foster, Music Together semester row.
- **Festivals & Community:** Manual pass on MV/LA city calendars, harvest weekends, Halloween fairs (Sep–Oct).
- **Seasonal drive picks:** Editorial farms/haunts live in `seasonal*DriveEvents.ts` — not library scrapers.
- **Core cities only in regular discovery:** Events outside Palo Alto / Los Altos / Mountain View belong in Seasonal → Worth a Little Drive until a city landing justifies a scraper.

## Ops

- Review queue: `/admin/discovery`
- Launch review: `/experiment/seasonal-launch-review`
- Refresh libraries: `npm run discover:bay-area -- --days=90`
- Regenerate this report: `npm run discover:expansion-lookahead`

