# Regional — weekend Worth a Drive search (~1 hour)

Weekly discovery pass for **seasonal outings a little farther afield** that the four-city library scrape misses: pumpkin patches, apple days, harvest festivals, farm open days, and cultural fall weekends **within about an hour of Palo Alto · Los Altos · Mountain View · Sunnyvale**.

This is the **drive** counterpart to [Core cities — weekend search](./core-cities-weekend-search.md). Qualifying finds stay out of regular Browse. Queue them as `Regional ·` Discovery rows, then promote into **Hello Fall / Halloween → Worth a little drive** (Hidden). Never **Approve → Go live** into the public feed.

## What runs automatically

| When | What |
|------|------|
| **Sundays @ 8:00 AM PT** | Library scrape (`discover-bay-area`) — storytimes & classes |
| **Thursdays @ 8:00 AM PT** | Core-city weekend web & social (`discover:core-weekend`) **and** this pass + 小紅書 inbox ingest (`discover:regional-weekly`) |

Instagram, roundup blogs, and city festival pages **cannot be fully scraped**. The Thursday job queues leads you (or Cursor) already pasted. The search itself is **agent-assisted**.

**Ask in chat:** “fall / seasonal activities within an hour of Puddles cities this weekend and next” — the agent should follow [`.cursor/skills/regional-weekend-drive-search/SKILL.md`](../.cursor/skills/regional-weekend-drive-search/SKILL.md).

GitHub Actions: [`.github/workflows/discover-regional-weekly.yml`](../.github/workflows/discover-regional-weekly.yml)

## Window

From the day you run it: **this weekend (Sat–Sun) and next weekend**. Also include seasonal farms whose **opening weekend** falls in that span (e.g. a patch that opens Friday). Skip weekdays unless a one-off is unusually strong.

## Radius (~1 hour from core cities)

**Usually in:** Peninsula (Menlo Park, Redwood City, San Mateo, Half Moon Bay, Pacifica), South Bay (Cupertino, Santa Clara, San Jose, Los Gatos, Morgan Hill), nearby East Bay (Hayward, Fremont, Union City), San Francisco, Livermore / Pleasanton (borderline).

**Usually out (too far):** Sebastopol / Sonoma apple country, Marin north of the Golden Gate as a default, Napa, Sacramento, Santa Cruz Boardwalk-only days unless paired with a farm already on the watchlist.

If a find is in a **core city**, use [core-cities weekend search](./core-cities-weekend-search.md) instead.

## Search path (in order)

1. **Official calendars & farms** (fact-check first)
   - [Palo Alto Online · late summer/fall festivals](https://www.paloaltoonline.com/) (seasonal roundup — treat as leads)
   - [Lemos Farm](https://www.lemosfarm.com/pumpkin-patch) · [Farmer John’s](https://www.farmerjohnspumpkins.com/) (Half Moon Bay)
   - [Spina Farms](https://spinafarmspumpkinpatch.com/) (Morgan Hill)
   - [Patchen Pumpkin Patch](https://patchencalifornia.com/pumpkin/) (Los Gatos)
   - [LARPD Applefest / Ravenswood](https://www.larpd.org/) (Livermore)
   - [HARD Ag Day at Meek Park](https://www.haywardrec.org/2083/Ag-Day-at-Meek-Park) (Hayward)
   - [Hidden Villa](https://www.hiddenvilla.org/programs/individuals-families/) (Los Altos Hills — confirm weekend farm tours; family page and catalog have disagreed)
   - [Gizdich Ranch u-pick](https://www.gizdich-ranch.com/u-pick) (Watsonville — call/confirm hours)
   - [Garin Regional Park](https://www.ebparks.org/parks/garin) (Hayward — annual apple festival)
   - [Roaring Camp](https://roaringcamp.com/events) (Felton — special weekends, not every train day)
   - City festival pages: Santa Clara Art & Wine, Cupertino / Silicon Valley Fall Fest, Flood Park Fallfest, SF Chinatown Moon Festival, Millbrae Mid-Autumn
2. **Roundup sites** — [Bay Area Kid Fun](https://www.bayareakidfun.com/family-friendly-events-in-the-bay-area/), [Funcheap SF](https://sf.funcheap.com/). Treat as leads; **open the official page** before writing copy.
3. **Social** — farm Instagram (Lemos, Farmer John’s, Patchen, Spina, Gizdich) and city rec accounts as a pointer to an official URL. Parent roundups (including 小紅書) are the same: official URL in the inbox, never the social post as `eventUrl` unless that **is** the announcement.

## Include / skip

Follow [community events](./community-events-inclusion.md), [seasonal featured](../.cursor/rules/seasonal-discovery-featured.mdc), and [event copy fact-check](../.cursor/rules/event-copy-fact-check.mdc).

**Include** when little ones have something to do **and** it is special because of this season (harvest, pumpkins, apples, Mid-Autumn, farm open days).

**Skip**

- Already on Puddles (including Hidden Worth a Drive rows) or in Admin Discovery
- Core-city events (Thursday pass)
- Ages 6+ / school-age only
- Food/drink/shopping/art-wine with no tot activity (Kids Zone, crafts, animals, rides)
- Car shows, coastal cleanup, adult concerts, evening wine “Harvest Nights”
- Farms that open **after** next weekend (hold for a later Thursday)
- Too far for ~1 hour (Sonoma/Marin north as a default)

## Inbox

Paste qualifying finds into [`data/discovery/regional-leads-inbox.json`](../data/discovery/regional-leads-inbox.json):

```json
{
  "leads": [
    {
      "title": "Applefest",
      "date": "2026-09-13",
      "startTime": "12:00",
      "endTime": "16:00",
      "venue": "Ravenswood Historic Site",
      "address": "2647 Arroyo Rd, Livermore, CA 94550",
      "city": "Livermore",
      "eventUrl": "https://www.larpd.org/2026-09-13-applefest",
      "description": "Heirloom apple tasting, cider pressing, orchard, old-fashioned games & an apple craft.",
      "tips": "Register on the LARPD Applefest page. Kids under 3 are free. Picnic on the lawn is welcome.",
      "cost": "Paid",
      "types": ["Festivals & Community", "Outdoor"],
      "leadSource": "web",
      "leadNotes": "Official LARPD page; ~1 hour from core cities"
    }
  ]
}
```

- `eventUrl` = official host page (not 小紅書 / Bay Area Kid Fun).
- `city` is **outside** Palo Alto, Los Altos, Mountain View, Sunnyvale.
- `date` required (`YYYY-MM-DD`). `leadSource`: `web` | `instagram` | `facebook` | `xiaohongshu` | `watchlist`.

Then:

```bash
npm run discover:regional-weekly
```

Review `/admin/discovery` — filter Source for `Regional ·`. **Do not Go live.** Add a Hidden row in `seasonalHelloFallDriveEvents.ts` / Halloween drive + `driveEventIds` when it earns Worth a little drive.

## Reports

Each Thursday run writes `data/discovery/regional-weekly-{date}.md`.

## Related

- [Regional discovery — weekly](./regional-discovery-weekly.md) — 小紅書 + watchlist ingest
- [Calendar Watchlist](./calendar-watchlist.md)
- [Core cities — weekend search](./core-cities-weekend-search.md)
