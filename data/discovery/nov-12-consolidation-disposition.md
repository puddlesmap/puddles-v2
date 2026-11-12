# Nov 12 discovery consolidation — disposition

Source: Notion *Nov 12 Discovery — Consolidated Events, Images & Before You Go*  
Checked against `src/data/sheet-events.json` on 2026-11-12.

## Already live — do not re-ADD

| Entry | Catalog id | Action |
| --- | --- | --- |
| Three Kings Day | `guide-el-dia-de-los-tres-reyes-magos-2027-01-09` (Jan 9, 2027) | Skip; date HOLD resolved |
| Menorahs & Miracles | `guide-menorahs-miracles-cdm-2026-12-06` | Skip; keep archival 2018 image |
| Magical Santa Dance Party | `disc-magical-santa-dance-party-2026-12-05-…` | Skip ADD; tips/address/URL polished |
| Gamble Second Saturday Nov 14 | `core-weekend-gamble-second-saturday-2026-11-14` | Skip ADD; copy/tips/image polished |
| Sunnyvale Sensory Storytime Nov 13 | `watchlist-sunnyvale-library-sensory-storytime-2026-11-13` | Skip; image left empty (Sunnyvale rule) |
| Bean & Lentil Mosaics | `disc-family-craft-bean-and-lentil-mosaics-2026-11-19-…` | Skip ADD; ages/tips polished |
| Family Fun Days Dec 12 | `family-fun-days-los-altos-community-center-2026-12-12-10-00` | Skip ADD; retitled Winter Wonderland |
| Cuesta Dec 10 / Pioneer Nov 17 & 24 / MV Mandarin | existing dated rows | Skip |

## Queued for Admin (verified official pages · unprocessed inbox leads)

Core cities inbox (`data/discovery/core-cities-weekend-inbox.json`):

- `core-weekend-museum-minis-anderson-2026-11-16`
- `core-weekend-sunday-crafternoon-2026-11-15`
- `core-weekend-baby-sign-stay-and-play-2026-12-05`
- `core-weekend-family-coloring-2026-11-20` (low priority)

Nearby / regional inbox (`data/discovery/regional-leads-inbox.json`):

- `regional-baby-wearing-dance-cupertino-2026-11-15`
- `regional-magical-bridge-rwc-stories-in-the-park-2026-11-24`
- `regional-magical-bridge-rwc-casa-circulo-2026-11-21`
- `regional-magical-bridge-rwc-casa-circulo-2026-12-05`
- `regional-magical-bridge-rwc-ragazzi-2026-12-06`
- `regional-marsh-hike-coyote-point-2026-11-20`
- `regional-fairyland-hummingbird-saves-fire-2026-11-14` (sessions 11 / 2 / 4)

Run `npm run discover:core-weekend` and `npm run discover:regional-weekly` to merge into Admin Discovery. Do **not** auto-publish.

## HOLD — tracked as processed skip rows (do not queue)

| Id | Why |
| --- | --- |
| `core-weekend-HOLD-sunnyvale-spanish-english-storytime-vivinavi` | Vivinavi only — need LibCal/city URL |
| `core-weekend-HOLD-sunnyvale-japanese-storytime-vivinavi` | Vivinavi only — need LibCal/city URL |
| `regional-HOLD-sensory-sunday-curiodyssey-2026-12-13` | Organizer time/reg conflict |
| `regional-HOLD-first-friday-nights-curiodyssey` | Toddler fit / tickets unconfirmed |

Also not queued (venue feature / age exclude): Collage Corner, Redwood Forest Storytelling, Nature Mobile 5+, EV Baylands 6+.

**Three Kings:** removed from date HOLD — Jan 9 already uploaded.

## Tip / image notes applied

- Prefixed tips on Gamble, Magical Santa, Bean mosaics, Family Fun Days / Winter Wonderland, Sunnyvale Sensory
- Bean mosaics `ageRange` → 4–5 (organizer invites 4–11); fixed misused `baby|` caregiver tip → `info|`
- Sunnyvale Sensory: no building host photo
- Menorahs: archival image unchanged
- Magical Santa: image left empty (rights not cleared); event URL → Magical Bridge event-details page
