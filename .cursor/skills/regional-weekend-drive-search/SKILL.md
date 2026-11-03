---
name: regional-weekend-drive-search
description: >-
  Weekly Puddles discovery pass that searches the open web and social media for
  ages 0–5 seasonal outings within about an hour of Palo Alto, Los Altos,
  Mountain View, and Sunnyvale this weekend and next (pumpkin patches, apple
  days, harvest festivals, farm open days). Use when the user asks for Worth a
  little drive, fall/seasonal Bay Area activities, ~1 hour from core cities, or
  regional weekend event search.
---

# Regional weekend Worth a Drive search

Read and follow [docs/regional-weekend-drive-search.md](../../../docs/regional-weekend-drive-search.md).

## Do this

1. Window = **this Sat–Sun and next Sat–Sun** (Pacific), plus farms whose opening weekend falls in that span.
2. Stay within **~1 hour** of the four core cities. Skip Sonoma apple country / far Marin as a default.
3. Search official farm and city pages, then roundup sites (Bay Area Kid Fun, Funcheap, Palo Alto Online, DoTheBay, SacTown for Kids), then Instagram/Facebook as a pointer to an official URL. Do not import a guide as a set.
4. Fact-check on the **official** page. Hours, price, and ages come from that page only. Do not invent ages, cost, or hours. Diff every lead against Published and Hidden drive rows before showing it.
5. Skip already-on-Puddles (including Hidden drive rows), core-city events, 6+ only, food/wine-only fests, and farms that open after next weekend. DoTheBay: daytime family only. SacTown: only a stop still about an hour away.
6. For each keeper, append a lead to `data/discovery/regional-leads-inbox.json` (`leadSource`: `web` | `instagram` | `facebook` | `xiaohongshu` | `watchlist`).
7. Run `npm run discover:regional-weekly` to queue **pending** `Regional ·` Admin Discovery rows. Wednesday 8:00 AM PT GitHub Action also ingests this inbox (same morning as the library scrape and core-city weekend search).
8. Tell the user what was queued and skipped. Do **not** Approve → Go live into regular Browse. Promote keepers into Hidden Worth a Drive only when the user asks to add them to Hello Fall / Halloween.

After farm calendars, open destination `nature-seasonal` + `museums-attractions` + `music-dance` watchlist rows. Capture series announcements; do not auto-publish early. Hidden Villa is core (Los Altos Hills). Deer Hollow Farm displays as Cupertino. Filoli stays Hidden + isRegional. Write `lastCheck` on each source you open.

Core-city finds (including Los Altos Hills in the Los Altos region) go to `data/discovery/core-cities-weekend-inbox.json` + `npm run discover:core-weekend`, not this inbox.
