# Core cities — weekend web & social search

Weekly discovery pass for **Palo Alto · Los Altos (including Los Altos Hills) · Mountain View · Sunnyvale** that library scrapers miss: Instagram pop-ups, garden mornings, shopping-center play days, farms, and city calendars.

This is the **core-city** counterpart to [Regional discovery — weekly](./regional-discovery-weekly.md) (Worth a little drive / 小紅書). Qualifying finds can **Approve → Go live** into regular Browse.

## What runs automatically

| When | What |
|------|------|
| **Wednesdays @ 8:00 AM PT** | Library scrape (`discover-bay-area`, including Linden Tree), this pass (`discover:core-weekend`), and Worth a little drive / 小紅書 (`discover:regional-weekly`) |

Instagram and the open web **cannot be fully scraped**. The Wednesday job queues leads you (or Cursor) already pasted. The search itself is **agent-assisted**. Pages GitHub cannot open are listed on `/admin`.

**Ask in chat:** “search this weekend and next for Puddles events in PA / MV / Los Altos / Sunnyvale” — the agent should follow [`.cursor/skills/core-cities-weekend-search/SKILL.md`](../.cursor/skills/core-cities-weekend-search/SKILL.md). After that hunt, `/admin` → Sources should show every channel as **Looked** except Sunnyvale Library (**Blocked**).

GitHub Actions: [`.github/workflows/discover-core-weekend.yml`](../.github/workflows/discover-core-weekend.yml)

## Window

Two ranges. Use both every pass.

| Range | What belongs |
|-------|----------------|
| **This Sat–Sun and next Sat–Sun** | Routine listings: classes, storytimes, pop-ups, play mornings |
| **Next 6 weeks** | One-offs that get announced early: grand openings, performance-series concerts, festivals, and anything that was **postponed** and just got a new date |

Skip ordinary weekdays. Keep a strong one-off (open house, festival kickoff, library opening) even when it falls on a weekday or past next weekend, as long as it is inside 6 weeks.

Example: a search on Oct 7 still includes a Saturday grand opening on Oct 31. That date is outside “next weekend,” and dropping it is how Lakewood was missed.

## Search path (in order)

1. **Official calendars** (fact-check first)
   - [Palo Alto Calendar](https://www.paloalto.gov/Home/Calendar) — dated grid (List View). Do not stop at [Events Directory](https://www.paloalto.gov/Events-Directory); that marketing list missed Storytime at the Baylands.
   - [Palo Alto Art Center family events](https://www.paloalto.gov/Events-Directory) — search Family Day and hands-on art specifically; the broad directory scan can bury venue programs
   - [Palo Alto Art Center Foundation · public list](https://paacf.org/events/category/public/list/) — not the city directory; skip adult lectures and member-only previews
   - [Cubberley Artist Studio Program · upcoming events](https://www.paloalto.gov/Departments/Community-Services/Arts-Sciences/Cubberley-Artist-Studio-Program/Upcoming-Events) — Open Studios and interactive public art
   - [Palo Alto Junior Museum & Zoo Upcoming Events](https://www.paloaltozoo.org/Home/Featured-Rows/Upcoming-Events/Upcoming-Events) — open in a browser; scrapers 404. Dated public specials and off-site storytimes only; ordinary admission is a place, not an event. Also [Inclusive Recreation](https://www.paloalto.gov/Departments/Community-Services/Activities-Programs/Inclusive-Recreation)
   - [PAUSD calendar](https://www.pausd.org/school-life/calendar) **plus individual elementary school calendars/news** — public carnivals, fairs and family events; confirm community admission
   - [LASD district calendar](https://www.lasdschools.org/district-calendar-and-events) **plus individual school/ParentSquare/PTA pages** — Santa Rita Witches’ Delight and similar public community traditions are not reliably on the district calendar
   - [MVWSD calendar](https://www.mvwsd.org/calendar) **plus individual elementary PTA/school pages** — Imai, Landels, Stevenson, Theuerkauf, Monta Loma, Bubb, Castro, Mistral, Vargas. Confirm community admission
   - [Sunnyvale School District calendar](https://www.sesd.org/about-usnew/calendar-81) **plus individual SESD elementary PTA/school pages** — Cherry Chase, Ellis, Cumberland, Bishop, Fairwood, Lakewood, San Miguel. Confirm public tickets or a community invitation; skip school-day parades
   - [Gamble Garden · Family & Kids](https://www.gamblegarden.org/events/category/kids/)
   - [Village at San Antonio Center](https://villageatsanantoniocenter.com/events/)
   - [Sunnyvale kids events](https://www.library.sunnyvale.ca.gov/events/kids-events) (watchlist — site blocks scrapers). **Open this calendar by hand every pass.** Saturday Family Storytime is a standing bump, not a new event.
   - [Sunnyvale special events](https://www.sunnyvale.ca.gov/recreation-and-community/special-events)
   - [MV special events](https://www.mountainview.gov/our-city/departments/community-services/special-events)
   - [Los Altos Community Events](https://www.losaltosca.gov/324/Community-Events) — city hub; Family Fun Days is only `/329`
   - [Downtown Los Altos](https://downtownlosaltos.org/events/)
   - [Los Altos Hills community calendar](https://www.losaltoshills.ca.gov/calendar.aspx) (Los Altos region)
   - [Hidden Villa](https://www.hiddenvilla.org/programs/individuals-families/) (Los Altos Hills — core, not Worth a Drive). One farm-tour row with `sessions`.
   - [Palo Alto Children’s Theatre](https://www.paloalto.gov/Departments/Community-Services/Arts-Sciences/Palo-Alto-Childrens-Theatre) and [PYT shows](https://pytnet.org/shows/) — production-level rows with official showtimes
   - [Deer Hollow Farm](https://www.mountainview.gov/our-city/departments/community-services/deer-hollow-farm) displays as **Cupertino** (22500 Cristo Rey Drive)
   - [Linden Tree calendar](https://www.lindentreebooks.com/events-calendar/) (also Wednesday scrape)
   - [Magical Bridge calendar](https://www.magicalbridge.org/calendar) — all locations; open **event-details** for hours. Do not use `/paloaltoevents` (404). Keep PA / MV / Sunnyvale only; skip Redwood City and farther
   - [FIT4MOM Silicon Valley Central](https://sunnyvale.fit4mom.com/schedule) — **Glofox class list** (Book buttons), not the pink monthly community calendar
   - [Palo Alto Children’s Theatre](https://www.paloalto.gov/Departments/Community-Services/Arts-Sciences/Palo-Alto-Childrens-Theatre) — hours, ages, and the show itself come from the theatre or city page, not an aggregator
   - [Palo Alto Elks public calendar](https://www.paloaltoelks.org/rsvp) — family yoga, trunk-or-treat, family movies
   - [Bing Nursery School · Performance Series](https://bingschool.stanford.edu/news-events/bing-performance-series) and [all upcoming events](https://bingschool.stanford.edu/news-events/all-upcoming-events) — Stanford campus counts as **Palo Alto**. Family concerts (sing-and-move, young audiences) are in. Skip coffee talks, staff development days, in-school-only shows, and virtual concerts limited to current Bing families. Palo Alto’s city directory does **not** list these.
   - [Stanford events](https://events.stanford.edu/) — only family / kids / all-ages programs from Bing, Cantor, and the museums. Skip academic talks.
   - Standing Parent & Me series (Marti Foster, Music Together) — bump next date; do not add weekly spam
   - **Finite concert series** already Published (Sunnyvale Orchard Music Series): if `date` is in the past and the official schedule still has a later night, **bump `date` to that next night**. One row. Leaving the first night’s date in place hides the rest of the series, because Browse treats that date as past.
2. **Roundup sites** — [Bay Area Kid Fun](https://www.bayareakidfun.com/family-friendly-events-in-the-bay-area/), [Funcheap SF](https://sf.funcheap.com/) (city + kids filters), DoTheBay, VenuNite, and ChatGPT pastes. These are **leads**. Diff every lead against Published rows before showing it. Hours, price, and ages come from the official page only. DoTheBay: daytime family listings only — skip concerts, nightlife, and 21+.
3. **Social** — open these accounts every pass. A city HTML calendar can lag a flyer by days.
   - [ca.ipa.usa](https://www.instagram.com/ca.ipa.usa/) / [ipausaca.org](https://www.ipausaca.org/)
   - [@cityofsunnyvale](https://www.instagram.com/cityofsunnyvale/) and [@sunnyvale_recreation](https://www.instagram.com/sunnyvale_recreation/) — Orchard Music Series and other rec nights are posted here
   - City of Sunnyvale Facebook (government page) — grand openings and postponed events often land here before the library calendar updates
   - City rec, library, Magical Bridge, Gamble Garden, Linden Tree, AAH Smile Farm
   - Parent forwards (WhatsApp, “BPP Parents Group,” neighborhood chats) are **leads**. Trace the host calendar and add that host to the watchlist. Do not treat the screenshot as the only source, and do not try to scrape the chat.
4. **Postponed rows stay on a reschedule watch.** If the library or city calendar still says POSTPONED, that event is not finished. Check city Facebook, Instagram, and local news for the new date. Do not skip it because the old LibCal row is stale. Lakewood’s kids-calendar row stayed “POSTPONED · Aug 29” after the city announced Oct 31.

## Search vocabulary

Pair every query with **Palo Alto / Los Altos / Mountain View / Sunnyvale, California** (not Texas). After the city directory, open **venue-specific** URLs — Pet Palooza lived at `/Community-Services/Pet-Parade`, not as an obvious kids row on the directory.

**Event types:** Halloween carnival, trunk or treat, costume parade, trick-or-treat, fall festival, harvest festival, holiday market, Diwali, Día de los Muertos, Lunar New Year, pet parade, animal encounter, zoo event, Family Day, open studio, community art, craft workshop, community celebration, street fair, neighborhood festival, school carnival, PTA fundraiser (public tickets only), family night, outdoor concert, dance, community performance, puppet show.

**Named annuals** (also in watchlist `knownEventPages`): Witches’ Delight, Pet Palooza, Cherry Chase Fall Festival, Cherry Chase Diwali, Duveneck Harvest Carnival, Cubberley Open Studios. Search the name, not only a generic keyword.

## Cadence

| When | What |
|------|------|
| **Weekly (Wednesday agent pass)** | Core city and venue calendars, school/PTA hubs, named annuals in season. Inbox ingest is the same morning as the library scrape. Do not scrape every campus. |
| **Monthly** | Annual festivals, carnivals, and seasonal community events via `knownEventPages`. |
| **Pre-weekend** | Re-open official URLs for queued keepers this Sat–Sun (hours, cancel, registration). Same agent pass or a short Friday check in chat — no second cron. |

Library scrapers stay 0–5 audience filters. The **agent** pass is what picks up all-ages community events inside the existing 6-week one-off window.

## Season step (same Wednesday pass)

After official city calendars, open the watchlist groups `performances-theatre`, `music-dance`, and destination `museums-attractions`. Capture series announcements and individual showtimes into the existing inbox. **Do not Go live** until a session is inside the public Browse window (60 days). Ticketed Nov–Dec theatre is the model: one production row with `sessions`, Admin pending until the window, not one card per showtime.

Write `lastCheck` on each source you open (`checked` | `no-new-events` | `extraction-failed` | `review-needed`, plus `eventsSeen` and `missedReason`).

JMZ **Amazing Animals / Preschool Discovery Science** stay Discovery-only (enrolled class series). Do not publish weekly drop-in cards.

## Include / skip

Follow [community events](./community-events-inclusion.md), [Parent & Me](./parent-and-me-inclusion.md), and [event copy fact-check](../.cursor/rules/event-copy-fact-check.mdc).

**Include** when a parent with a baby, toddler, or preschooler can watch or join (parade, carnival, crafts, animals, open studios, Family Day, puppet show). A Kids Zone is not required. Generic adult events do not qualify just because children are allowed.

**Public school events:** a school campus does not make an event private or public. Include only when the **current** official page invites the community/public, sells public tickets, or is a named community tradition (Witches’ Delight, Cherry Chase Fall Festival). Confirm the date and admission every year. Skip assemblies, classroom programs, school-day parades, field trips, principal coffees, enrolled-family-only nights (Ellis Trunk or Treat, Imai Trunk or Treat), and school-age fundraisers with no meaningful experience for ages 0–5. Do not scrape every campus — use district/PTA hubs plus `knownEventPages` annuals.

**Access** (`access` on the inbox lead): `public` | `school-community` | `registered` | `members` | `enrolled` | `unknown`. Paid + registration can still be `public`. Set `unknown` when admission is unclear and **hold** (do not Approve → Go live). Never publish `enrolled` or `unknown`. For `school-community` / `members`, copy the official limitation into description and Before you go. Do not reuse `audiences` (that is BiblioCommons age labels).

**Hold in inbox** (do not Approve → Go live): unclear admission, school “families welcome” without non-enrolled language, missing date/hours, uncertain 0–5 fit.

**Skip**

- Already on Puddles or in Admin Discovery **as the same one-off**
- Published **series whose `date` is still upcoming** (FIT4MOM, Marti, library storytimes, finite concert series such as Orchard Music) — if the date is **past** and a later occurrence remains, bump it instead of skipping or adding a second row
- Ages 6+ / school-age only (e.g. library “Kids 6–11”)
- Food/drink/shopping with no tot activity
- Weekly storytimes the library scrape already covers
- Enrollment series spam (one series row is enough)
- Coastal cleanup, civic town halls, car shows, adult concerts
- FIT4MOM virtual adult classes, Village Cafe / Run Club / office-closed graphics, Body Ignite, prenatal FIT4BABY
- Gym **weekly membership** classes (Parent/Child series stay one row if listed at all)
- Farmers markets with no kids activation (the market itself is not an event)
- Repair cafés, unless the official page has a kids station
- K–8 / emergent-reader programs (marking 5+ still points parents of 2–3 the wrong way)
- Long nature classes that never name something for ages 0–5

**Drop-off gym specials** (Little Gym Parent Survival Night, My Gym Parents’ Night Out): include as **Classes**, never Parent & Me. Title must say drop-off / Survival Night / Night Out. Dated specials only.

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
      "access": "public",
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
