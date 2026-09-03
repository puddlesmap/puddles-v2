# Regional discovery — weekly review

Generated: 2026-09-02

Pending **Regional ·** rows in Admin Discovery (Worth a Drive / 小紅書 leads).
Approve only after checking the **official** event page.

**Pending count:** 9

| Date | Title | City | Source |
| --- | --- | --- | --- |
| 2026-09-05 | Labor Day Weekend at Roaring Camp | Felton | Regional · Worth a Drive · Roaring Camp Railroads |
| 2026-09-05 | Scottish Highland Gathering & Games | Pleasanton | Regional · Lead · agent |
| 2026-09-05 | Kings Mountain Art Fair | Woodside | Regional · Lead · agent |
| 2026-09-05 | Lemos Farm Fall Pumpkin Patch | Half Moon Bay | Regional · Worth a Drive · Lemos Farm |
| 2026-09-06 | Garin Apple Festival | Hayward | Regional · Worth a Drive · Garin Apple Festival |
| 2026-09-19 | Garlic City Car Show & Harvest Festival | Gilroy | Regional · Lead · agent |
| 2026-09-25 | Nicasio Valley Pumpkin Patch | Nicasio | Regional · Lead · agent |
| 2026-09-25 | The Great Big BOO! at Gilroy Gardens | Gilroy | Regional · Lead · agent |
| 2026-10-17 | Half Moon Bay Art & Pumpkin Festival | Half Moon Bay | Regional · Lead · agent |

## Weekly human step (小紅書)

1. Search Bay Area parent accounts for weekend / holiday roundups (e.g. Labor Day, Halloween, pumpkin season).
2. For each fit: find the **official** host page — not the XHS post URL.
3. Add a row to `data/discovery/regional-leads-inbox.json` with `leadSource: "xiaohongshu"`.
4. Run `npm run discover:regional-weekly` (or wait for Friday GitHub Action).
5. Review in `/admin/discovery` → Approve → Go live → Hello Fall / seasonal drive as appropriate.

## Commands

- `npm run discover:regional-weekly` — ingest watchlist + inbox + this report
- `npm run discover:ingest-expansion` — watchlist expansion rows only

