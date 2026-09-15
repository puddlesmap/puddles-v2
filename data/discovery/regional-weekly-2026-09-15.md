# Regional discovery — weekly review

Generated: 2026-09-15

Pending **Regional ·** rows in Admin Discovery (Worth a Drive / weekend ~1 hour / 小紅書).
Approve only after checking the **official** event page.

**Pending count:** 6

| Date | Title | City | Source |
| --- | --- | --- | --- |
| 2026-09-13 | Applefest at Ravenswood | Livermore | Regional · Lead · web |
| 2026-09-18 | Patchen Pumpkin Patch | Los Gatos | Regional · Lead · web |
| 2026-09-19 | Ag Day at Meek Park | Hayward | Regional · Lead · web |
| 2026-09-19 | Millbrae Mid-Autumn Festival | Millbrae | Regional · Lead · web |
| 2026-09-25 | Webb Ranch Pumpkin Patch | Portola Valley | Regional · Lead · web |
| 2026-09-26 | Pacific Coast Fog Fest | Pacifica | Regional · Lead · web |

## Queued this pass (3 new)

- **Webb Ranch Pumpkin Patch** (Portola Valley) — opens Fri Sep 25 through Oct 31.
- **Pacific Coast Fog Fest** (Pacifica) — Sep 26–27; official site lists Family Fun Fest and play areas.
- **Millbrae Mid-Autumn Festival** — Sep 19–20; Eventbrite is generic family-fun (Admin may Skip if too food/shopping).

Applefest, Patchen, and Ag Day were already in the regional pending pile (Ag Day is already Live on Hello Fall — skip adding a second draft).

## Skipped — already on Puddles / Hello Fall drive

- Farmer John’s, Spina Farms, Patchen, Flood Park Fallfest, Santa Clara Art & Wine, Ag Day at Meek Park
- Kings Mountain Art Fair / Scottish Games (already dispositioned)

## Watch / skip this pass

- **Filoli Autumn Days** — official page timed out; Harvest Days already discussed as Unplaced in Admin.
- **Santa Clara Art & Wine** — already a drive row; do not duplicate.
- Fog Fest music-only stages — included only because Family Fun Fest is on the official site.
- Far Marin / Sonoma apple country — out of ~1 hour default.

Do **not** Go live into Browse. Assign Hello Fall (or another collection) after Add to Seasonal.

## Weekly human / agent step

1. Search official farms + roundups for **this weekend and next** within ~1 hour of the four core cities (`docs/regional-weekend-drive-search.md`).
2. Search 小紅書 for Bay Area parent roundups (pumpkin / harvest / holiday).
3. For each fit: find the **official** host page — not the social post URL.
4. Add a row to `data/discovery/regional-leads-inbox.json` (`leadSource`: `web` | `instagram` | `xiaohongshu` | …).
5. Run `npm run discover:regional-weekly` (or wait for Thursday GitHub Action).
6. Review in `/admin/discovery`. Do not Go live — Hidden Worth a Drive when it earns a seasonal slot.

## Commands

- `npm run discover:regional-weekly` — ingest watchlist + inbox + this report
- `npm run discover:ingest-expansion` — watchlist expansion rows only

