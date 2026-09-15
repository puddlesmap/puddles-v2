# Core cities — weekend search review

Generated: 2026-09-15

Pending **Core cities · Weekend search** rows in Admin Discovery.
These are Palo Alto / Los Altos / Mountain View / Sunnyvale — Approve → Go live when copy checks out.

**Pending count:** 3

| Date | Title | City | Source |
| --- | --- | --- | --- |
| 2026-09-16 | Magical Bridge Performance Series | Mountain View | Core cities · Weekend search · web |
| 2026-10-10 | Second Saturday at Gamble Garden | Palo Alto | Core cities · Weekend search · web |
| 2026-11-14 | Second Saturday at Gamble Garden | Palo Alto | Core cities · Weekend search · web |

## Queued this pass (3)

- **Magical Bridge Performance Series** (MV, next listed date Wed Sep 16, 4:00–5:00 PM) — calendar named remaining dates Sep 16, 30 & Oct 14. Not Bookmobile storytime.
- **Second Saturday at Gamble Garden** — Oct 10 and Nov 14 (Sep 12 already live).

## Skipped — already on Puddles

- Magical Bridge **Bookmobile storytimes** (10:00 AM Rengstorff)
- Harvest History Festival (Sep 26)
- Halloween Magic at Gamble (Oct 24)
- Sunnyvale Diwali (Oct 3) and Mid-Autumn downtown
- Music Together fall semester, FIT4MOM, Marti Foster, Mini Yoga Club
- Gamble Parent & Me Yoga Sep 19 (ages 4–8; already dismissed in Discovery)

## Watch / blocked

- **Sunnyvale Library kids calendar** — site returns almost no event list to automated fetch. Standing storytimes already seeded; did not invent one-offs.
- **Hidden Villa weekend farm tours** — official family page: not offering weekend farm tours this fall. Family Yoga is ages 7+.
- **Talo Yoga / Bunnyhive / The Little Gym MV / Sunnyvale Rec Parent & Tot** — no fresh official term page pulled this pass; do not duplicate enrollment spam.
- **Gamble Family Fun with Flowers** (Oct 31) — adult/child arranging; registration price not on the page we fetched.
- Magical Bridge **Palo Alto** calendar had no new 0–3 month program beyond stale Community Partner Day pages.
- Mountain View city special-events URL was **Akamai blocked**.

## Cadence

This is the **pre-run**. Weekly Thursday **agent search** starts **9/24**. GitHub already ingests these inboxes Thursdays 8:00 AM PT — it does not search.

Do **not** header Deploy / Go live from this pass. Review in `/admin` Inbox: Add / Seasonal / Watch / Skip.

## Weekly human / agent step

1. Search official calendars + Instagram for **this weekend and next** in the four core cities.
2. Fact-check on the official host page.
3. Add keepers to `data/discovery/core-cities-weekend-inbox.json`.
4. Run `npm run discover:core-weekend` (or wait for Thursday GitHub Action).
5. Review in `/admin/discovery` → Approve → Go live.

## Commands

- `npm run discover:core-weekend` — ingest inbox + this report
- `npm run discover:regional-weekly` — out-of-area Worth a Drive / 小紅書

