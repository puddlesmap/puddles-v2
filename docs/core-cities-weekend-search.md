# Core cities — weekend web & social search

Weekly discovery pass for **Palo Alto · Los Altos · Mountain View · Sunnyvale** that library scrapers miss: Instagram pop-ups, garden mornings, shopping-center play days, farms, and city calendars.

This is the **core-city** counterpart to [Regional discovery — weekly](./regional-discovery-weekly.md) (Worth a little drive / 小紅書). Qualifying finds can **Approve → Go live** into regular Browse.

## What runs automatically

| When | What |
|------|------|
| **Sundays @ 8:00 AM PT** | Library scrape (`discover-bay-area`) — storytimes & classes |
| **Thursdays @ 8:00 AM PT** | This pass (`discover:core-weekend`) **and** Worth a little drive / 小紅書 (`discover:regional-weekly`) |

Instagram and the open web **cannot be fully scraped**. The Thursday job queues leads you (or Cursor) already pasted. The search itself is **agent-assisted**.

**Ask in chat:** “search this weekend and next for Puddles events in PA / MV / Los Altos / Sunnyvale” — the agent should follow [`.cursor/skills/core-cities-weekend-search/SKILL.md`](../.cursor/skills/core-cities-weekend-search/SKILL.md).

GitHub Actions: [`.github/workflows/discover-core-weekend.yml`](../.github/workflows/discover-core-weekend.yml)

## Window

From the day you run it: **this weekend (Sat–Sun) and next weekend (the following Sat–Sun)**. Skip weekdays unless a one-off is unusually strong (open house, festival kickoff).

## Search path (in order)

1. **Official calendars** (fact-check first)
   - [Palo Alto Events Directory](https://www.paloalto.gov/Events-Directory)
   - [Gamble Garden · Family & Kids](https://www.gamblegarden.org/events/category/kids/)
   - [Village at San Antonio Center](https://villageatsanantoniocenter.com/events/)
   - [Sunnyvale kids events](https://www.library.sunnyvale.ca.gov/events/kids-events) (watchlist — site blocks scrapers)
   - [Sunnyvale special events](https://www.sunnyvale.ca.gov/recreation-and-community/special-events)
   - [MV special events](https://www.mountainview.gov/our-city/departments/community-services/special-events)
   - [Downtown Los Altos](https://downtownlosaltos.org/events/)
   - [Linden Tree calendar](https://www.lindentreebooks.com/events-calendar/) (also Sunday scrape)
   - [Magical Bridge Palo Alto](https://www.magicalbridge.org/paloaltoevents)
2. **Roundup sites** — [Bay Area Kid Fun](https://www.bayareakidfun.com/family-friendly-events-in-the-bay-area/), [Funcheap SF](https://sf.funcheap.com/) (city + kids filters). Treat as leads; **open the official page** before writing copy.
3. **Social** — Instagram/Facebook hosts, not screenshots as the only source:
   - [ca.ipa.usa](https://www.instagram.com/ca.ipa.usa/) / [ipausaca.org](https://www.ipausaca.org/)
   - City rec, library, Magical Bridge, Gamble Garden, Linden Tree, AAH Smile Farm
   - Local parent accounts only as a pointer to an official URL

## Include / skip

Follow [community events](./community-events-inclusion.md), [Parent & Me](./parent-and-me-inclusion.md), and [event copy fact-check](../.cursor/rules/event-copy-fact-check.mdc).

**Include** when little ones have something to do (play materials, craft, storytime, animals, Kids Zone, foam/puppets).

**Skip**

- Already on Puddles or in Admin Discovery
- Ages 6+ / school-age only (e.g. library “Kids 6–11”)
- Food/drink/shopping with no tot activity
- Weekly storytimes the library scrape already covers
- Enrollment series spam (one series row is enough)
- Coastal cleanup, civic town halls, car shows, adult concerts

## Inbox

Paste qualifying finds into [`data/discovery/core-cities-weekend-inbox.json`](../data/discovery/core-cities-weekend-inbox.json):

```json
{
  "leads": [
    {
      "title": "National Day of Play Pop-up Playdate",
      "date": "2026-09-19",
      "startTime": "10:00",
      "endTime": "12:00",
      "venue": "Mitchell Park · Tot area",
      "address": "3700 Middlefield Rd, Palo Alto, CA 94303",
      "city": "Palo Alto",
      "eventUrl": "https://www.instagram.com/ca.ipa.usa/p/DdF8FRvJfCV/",
      "description": "Pop-up play materials to play, create & move — meet by Mitchell Park’s tot area.",
      "tips": "Drop in by the tot area and look for the IPA USA CA team.",
      "cost": "Free",
      "types": ["Social & Play", "Outdoor"],
      "leadSource": "instagram",
      "leadNotes": "ca.ipa.usa flyer; National Day of Play confirmed on ipausa.org"
    }
  ]
}
```

- `eventUrl` = official host page (Instagram post is OK when that **is** the announcement).
- `city` must be Palo Alto, Los Altos, Mountain View, or Sunnyvale. Out-of-area → [regional inbox](../data/discovery/regional-leads-inbox.json).
- `date` required (`YYYY-MM-DD`).

Then:

```bash
npm run discover:core-weekend
```

Review `/admin/discovery` — filter Source for `Core cities · Weekend search`. **Approve → Go live** (these are core cities).

## Reports

Each run writes `data/discovery/core-weekend-{date}.md`.

## Related

- [Calendar Watchlist](./calendar-watchlist.md)
- [Event discovery](./event-discovery.md)
- `npm run discover:regional-weekly` — farms/festivals outside the four cities (~1 hour weekend search: [regional-weekend-drive-search.md](./regional-weekend-drive-search.md))
