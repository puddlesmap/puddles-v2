# Regional discovery — weekly review

Generated: 2026-10-29

Pending **Regional ·** rows in Admin Discovery (Worth a Drive / 小紅書 leads).
Approve only after checking the **official** event page.

**Pending count:** 8

| Date | Title | City | Source |
| --- | --- | --- | --- |
| 2026-11-21 | Winter Wonderlab | Sausalito | Regional · Lead · agent |
| 2026-11-29 | Glider Discovery | San Carlos | Regional · Lead · agent |
| 2026-12-05 | GIFTY Holiday Craft Fair & Open House | Oakland | Regional · Lead · agent |
| 2026-12-12 | Fairy Winterland | Oakland | Regional · Lead · agent |
| 2026-12-26 | Open Cockpit Day | San Carlos | Regional · Lead · agent |
| 2026-12-27 | Robot Roundup · Bee-Bots | San Carlos | Regional · Lead · agent |
| 2026-12-31 | Noon Year's Eve | Sausalito | Regional · Lead · agent |
| 2026-12-31 | Countdown in Wonderland | Oakland | Regional · Lead · agent |

## Weekly human step (小紅書)

1. Search Bay Area parent accounts for weekend / holiday roundups (e.g. Labor Day, Halloween, pumpkin season).
2. For each fit: find the **official** host page — not the XHS post URL.
3. Add a row to `data/discovery/regional-leads-inbox.json` with `leadSource: "xiaohongshu"`.
4. Run `npm run discover:regional-weekly` (or wait for Friday GitHub Action).
5. Review in `/admin/discovery` → Approve → Go live → Hello Fall / seasonal drive as appropriate.

## Commands

- `npm run discover:regional-weekly` — ingest watchlist + inbox + this report
- `npm run discover:ingest-expansion` — watchlist expansion rows only

