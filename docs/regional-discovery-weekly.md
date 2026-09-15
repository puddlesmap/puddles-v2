# Regional discovery — weekly Bay Area pass

Puddles **Regular Browse** stays Palo Alto · Los Altos · Mountain View · Sunnyvale. Larger Bay Area outings (farms, festivals, trains) stay out of regular Browse. Queue them as `Regional ·` Discovery rows for review, then promote **only** into **Hello Fall / Halloween → Worth a little drive** (Hidden seasonal drive events) — never Go live into the public feed.

## What runs automatically

| When | What |
|------|------|
| **Sundays @ 8:00 AM PT** | Library scrape (`discover-bay-area`) — four-city storytimes & classes (Approve → Go live required) |
| **Thursdays @ 8:00 AM PT** | Weekly review: core-city weekend web & social (`discover:core-weekend`) **and** regional / Worth a little drive (`discover:regional-weekly`) + 小紅書 inbox. Agent search: [core cities](./core-cities-weekend-search.md) · [weekend Worth a Drive (~1 hour)](./regional-weekend-drive-search.md). |
| Mid-week | Manual runs only |

GitHub Actions: [`.github/workflows/discover-regional-weekly.yml`](../.github/workflows/discover-regional-weekly.yml) · [`.github/workflows/discover-bay-area.yml`](../.github/workflows/discover-bay-area.yml)

## 小紅書 — why not fully automatic?

小紅書 blocks scrapers, requires login, and posts are **curated roundups** — not authoritative event data. Puddles rule: [official host page first](../.cursor/rules/event-copy-fact-check.mdc).

**Workflow:** you (or Cursor) search 小紅書 or the open web → paste **official URLs** into the inbox → Thursday job queues **pending** rows for your review. Nothing auto-publishes.

**Ask in chat:**

- “fall activities within an hour of Puddles cities this weekend and next” — follow [weekend Worth a Drive search](./regional-weekend-drive-search.md)
- “幫我搜尋本週灣區大型活動” — 小紅書 / official pages into the same inbox

## Weekly steps (≈15 min)

1. **Web & social (~1 hour)** — this weekend + next: farms, harvest festivals, pumpkin patches. See [Regional — weekend Worth a Drive search](./regional-weekend-drive-search.md).
2. **Search 小紅書** — keywords like `湾区 亲子`, `Labor Day`, `南瓜`, `万圣节`, `周末 遛娃`.
3. **Pick 3–5** with clear toddler activities (not adult concerts / 6+ only).
4. **Open each official page** (city, EBRPD, farm, railroad, museum).
5. **Add to inbox** — [`data/discovery/regional-leads-inbox.json`](../data/discovery/regional-leads-inbox.json):

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

6. **Run locally** (optional before Thursday):

```bash
npm run discover:regional-weekly
```

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
- [Regional — weekend Worth a Drive search](./regional-weekend-drive-search.md) — ~1 hour, this weekend + next (Thursday)
- [Core cities — weekend search](./core-cities-weekend-search.md) — PA / LA / MV / Sunnyvale web & Instagram (Thursday)
- [Event discovery layers](./event-discovery-layers.md) — Worth a Little Drive
- `npm run discover:ingest-expansion` — watchlist rows only (no inbox)
