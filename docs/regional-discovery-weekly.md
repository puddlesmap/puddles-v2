# Regional discovery — weekly Bay Area pass

Puddles **Regular Browse** stays Palo Alto · Los Altos · Mountain View · Sunnyvale. Larger Bay Area outings (farms, festivals, trains) stay out of regular Browse. Queue them as `Regional ·` Discovery rows for review, then promote **only** into **Hello Fall / Halloween → Worth a little drive** (Hidden seasonal drive events) — never Go live into the public feed.

## What runs automatically

| When | What |
|------|------|
| **Sunday** | Library scrape (`discover-bay-area`) — four-city storytimes & classes |
| **Friday** | Regional pass (`discover:regional-weekly`) — watchlist drive rows + inbox leads + report |

GitHub Actions: [`.github/workflows/discover-regional-weekly.yml`](../.github/workflows/discover-regional-weekly.yml)

## 小紅書 — why not fully automatic?

小紅書 blocks scrapers, requires login, and posts are **curated roundups** — not authoritative event data. Puddles rule: [official host page first](../.cursor/rules/event-copy-fact-check.mdc).

**Workflow:** you (or Cursor) search 小紅書 or the open web → paste **official URLs** into the inbox → Friday job queues **pending** rows for your review. Nothing auto-publishes.

**Ask in chat:** “幫我搜尋本週灣區大型活動” — the agent can web-search official pages and fill `regional-leads-inbox.json`, then run `discover:regional-weekly`.

## Weekly steps (≈15 min)

1. **Search 小紅書** — keywords like `湾区 亲子`, `Labor Day`, `南瓜`, `万圣节`, `周末 遛娃`.
2. **Pick 3–5** with clear toddler activities (not adult concerts / 6+ only).
3. **Open each official page** (city, EBRPD, farm, railroad, museum).
4. **Add to inbox** — [`data/discovery/regional-leads-inbox.json`](../data/discovery/regional-leads-inbox.json):

```json
{
  "leads": [
    {
      "title": "Garin Apple Festival",
      "date": "2026-09-06",
      "startTime": "10:00",
      "endTime": "14:00",
      "venue": "Garin Regional Park",
      "address": "1320 Garin Avenue, Hayward, CA 94544",
      "city": "Hayward",
      "eventUrl": "https://www.ebparks.org/parks/garin",
      "description": "…from official page…",
      "tips": "…from official page…",
      "cost": "Free",
      "leadSource": "xiaohongshu",
      "leadNotes": "Hti 华通 Labor Day roundup slide 4"
    }
  ]
}
```

5. **Run locally** (optional before Friday):

```bash
npm run discover:regional-weekly
```

6. **Review** `/admin/discovery` — filter Source for `Regional ·`.
7. **Review** `/admin/discovery` — filter Source for `Regional ·`.
8. **Do not Approve → Go live** into regular Browse (blocked for non-core cities). Instead add a Hidden row under `seasonalHelloFallDriveEvents.ts` / Halloween drive + `driveEventIds` when it earns Seasonal / Worth a little drive.

## Inbox rules

- `eventUrl` must be the **host official page** — never the 小紅書 link.
- `date` required (`YYYY-MM-DD`).
- After a successful queue, the lead is marked `processed: true` (kept for audit).
- Duplicates (same URL / already on catalog) are skipped automatically.

## Reports

Each run writes `data/discovery/regional-weekly-{date}.md` — pending regional rows table for quick review.

## Related

- [Calendar Watchlist](./calendar-watchlist.md) — recurring regional sources (Lemos, Garin, Roaring Camp, …)
- [Event discovery layers](./event-discovery-layers.md) — Worth a Little Drive
- `npm run discover:ingest-expansion` — watchlist rows only (no inbox)
