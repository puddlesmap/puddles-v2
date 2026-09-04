# Regional discovery — weekly review

Generated: 2026-09-04

Pending **Regional ·** rows in Admin Discovery (Worth a Drive / 小紅書 leads).
Approve only after checking the **official** event page.

**Pending count:** 0

_No pending regional rows. Add leads to `data/discovery/regional-leads-inbox.json` or extend Calendar Watchlist._

## Weekly human step (小紅書)

1. Search Bay Area parent accounts for weekend / holiday roundups (e.g. Labor Day, Halloween, pumpkin season).
2. For each fit: find the **official** host page — not the XHS post URL.
3. Add a row to `data/discovery/regional-leads-inbox.json` with `leadSource: "xiaohongshu"`.
4. Run `npm run discover:regional-weekly` (or wait for Friday GitHub Action).
5. Review in `/admin/discovery` → Approve → Go live → Hello Fall / seasonal drive as appropriate.

## Commands

- `npm run discover:regional-weekly` — ingest watchlist + inbox + this report
- `npm run discover:ingest-expansion` — watchlist expansion rows only

