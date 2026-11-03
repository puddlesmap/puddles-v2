# Regional discovery — weekly review

Generated: 2026-11-03

Pending **Regional ·** rows in Admin Discovery (Worth a Drive / weekend ~1 hour / 小紅書).
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

