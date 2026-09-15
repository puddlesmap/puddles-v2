# Event discovery (roadmap)

Automated collection of family events (ages 0–5) for Puddles review, then publish.

## Best long-term path

| Phase | What | Storage |
|-------|------|---------|
| **0 — Experiment** | One-shot Palo Alto Library pull (next 14 days) | Local files in `data/discovery/` |
| **1 — Product** | Admin **Discovery** page + Sunday cron (60-day window) | Repo JSON (`src/data/discovery-candidates.json`); review in Admin |
| **2 — Scale** | Los Altos (SCCL) + Mountain View (LibCal); **city / community calendars** via [Calendar Watchlist](./calendar-watchlist.md) | Same Admin pipeline (manual first) |
| **3 — Only if needed** | Real database for multi-editor realtime | DB behind Admin |
| **Later optional** | All ops in Admin; retire day-to-day Google Sheets | DB = source of truth; Sheet = optional CSV export |

### Principles

1. **Human review** before anything goes live (no auto-Publish).
2. **Discovery queue is not the Events spreadsheet** — review in Admin; Sheet (or DB) only when promoting to Draft/Published.
3. **Library calendars first** (BiblioCommons / LibCal-style APIs). Weekly **web & social** search for the four core cities is a separate Thursday pass — see [Core cities weekend search](./core-cities-weekend-search.md).
4. **Dedupe by official URL** so weekly runs stay small after the first pass.
5. **One publishing path** — Events → sync → site (unchanged until a full Admin/DB migration).

### Approve path (Admin → Go live)

1. Run `npm run discover:bay-area` (PA + Los Altos + Mountain View) or a single-city script → updates `src/data/discovery-candidates.json`
2. Open **Admin → Discovery** (`/admin/discovery`)
3. Edit title / tips (Good to know) / room / ages / types as needed
4. **Approve** → **Ready** + **Approved on** = today (this browser)
5. **Go live** on Ready items → Published on the public catalog via Admin publish API (~2–4 min). Items move to Discovery **Live**.
6. Monitor **Events** → Live / Needs attention / Past

Dismiss keeps the candidate out of the pending queue (saved in this browser’s localStorage).

### Experiment / refresh queue

```bash
npm run discover:bay-area -- --days=30
# or one city:
npm run discover:palo-alto -- --days=30
npm run discover:los-altos -- --days=30
npm run discover:mountain-view -- --days=30
```

Writes dated CSV/JSON under `data/discovery/` **and** the Admin queue at `src/data/discovery-candidates.json`.

### Scheduled refresh (GitHub Actions)

| Trigger | When | Workflow |
|---|---|---|
| **Sunday cron** | 8:00 AM PT | [`.github/workflows/discover-bay-area.yml`](../.github/workflows/discover-bay-area.yml) — library queue refresh (`discover:bay-area`, ~90 days). New finds need **Approve → Go live** (no auto-publish). |
| **Thursday cron** | 8:00 AM PT | Core-city weekend inbox ([`discover-core-weekend.yml`](../.github/workflows/discover-core-weekend.yml)) **and** regional / Worth a little drive ([`discover-regional-weekly.yml`](../.github/workflows/discover-regional-weekly.yml)). Search itself is agent-assisted (web, social, 小紅書). |
| **Manual** | Anytime | GitHub → Actions → run a workflow, or locally `npm run discover:bay-area` / `discover:core-weekend` / `discover:regional-weekly` |
| Mid-week | Manual only | Same commands as above |

Each Sunday run:

1. `npm run discover:bay-area -- --days=90` (default in CI)
2. Merges into `discovery-candidates.json` and **preserves** `reviewStatus` / `convertedEventId` / `lastChecked` for matching library events
3. **Keeps** non-library rows (Calendar Watchlist · …) that were already in the Admin queue
4. `npm run build` — fail early if data breaks the app
5. Commit + push → Netlify deploy (~2–4 min) → review in **Admin → Discovery**

Mountain View **city** special events (festivals, movies on Castro, etc.) are **not** on LibCal — they stay on the [Calendar Watchlist](./calendar-watchlist.md) (Akamai blocks automated fetch of mountainview.gov). Marketing page URLs like `/special-events/harvest-history-festival` are aliased to CivicPlus calendar event IDs when marking already-on-Puddles.

### Core cities — weekend web & social (Thursdays)

Library scrapers miss Instagram pop-ups, garden mornings, and shopping-center play days. Each Thursday (or in chat: “search this weekend and next”), search official calendars + social for **Palo Alto · Los Altos · Mountain View · Sunnyvale**, then paste official URLs into `data/discovery/core-cities-weekend-inbox.json`. See [Core cities — weekend search](./core-cities-weekend-search.md).

| Command | When |
|---------|------|
| `npm run discover:core-weekend` | Local or Thursday GitHub Action (8:00 AM PT) |
| Inbox | `data/discovery/core-cities-weekend-inbox.json` |

These **can** Approve → Go live (core cities). Out-of-area finds still use the regional inbox.

### Regional / Worth a Drive (Thursdays, same morning as core cities)

Bay Area destination events (farms, festivals, trains) outside the four Browse cities — plus **小紅書** and **weekend web/social (~1 hour)** leads you paste with official URLs — use the Thursday review pass. See [Regional discovery — weekly](./regional-discovery-weekly.md) and [weekend Worth a Drive search](./regional-weekend-drive-search.md).

| Command | When |
|---------|------|
| `npm run discover:regional-weekly` | Local or Thursday GitHub Action (8:00 AM PT) |
| Inbox | `data/discovery/regional-leads-inbox.json` |

Workflow: [`.github/workflows/discover-regional-weekly.yml`](../.github/workflows/discover-regional-weekly.yml)

### Seasonal picks ↔ Discovery

Every Hello Fall / Halloween curated pick should have a matching row in Admin → Discovery (**Seasonal picks** tab). Source of truth for the pick list: `src/data/seasonalDiscovery.ts` (`collectionEventIds`, `driveEventIds`, `featuredWindows`).

| Command | What |
|---------|------|
| `npm run discover:sync-seasonal` | Add/update Discovery rows for all seasonal picks (tags `Seasonal · Hello Fall` / `Seasonal · Halloween`) |

Pipeline map: `src/utils/seasonalDiscoveryPipeline.ts` (includes Biblio id aliases when scrape id ≠ live event id).

| Script | Source |
|--------|--------|
| `discover:palo-alto` | Palo Alto Library · BiblioCommons |
| `discover:los-altos` | SCCL Los Altos + Woodland branches |
| `discover:mountain-view` | Mountain View Library · LibCal |
| `discover:bay-area` | All three into one Admin queue |
| `discover:expansion-lookahead` | 90-day report for **Sunnyvale** + **Parent & Me** + **Festivals** (no scrape) |
| `discover:expansion-refresh` | `discover:bay-area --days=90` then expansion report |

### Expansion lookahead (new city + launch types)

For launch expansion (Sunnyvale city filter, Parent & Me, Festivals & Community):

```bash
# Refresh libraries + write report (recommended monthly)
npm run discover:expansion-refresh

# Report only (uses current discovery-candidates.json)
npm run discover:expansion-lookahead -- --days=90
```

Writes:

- `docs/calendar-watchlist-next-2-months.md` — human-readable priorities
- `data/discovery/expansion-lookahead-{date}.json` — machine-readable stats

**Sunnyvale library** is on the [Calendar Watchlist](./calendar-watchlist.md) (site blocks scrapers) until `discover-sunnyvale.mjs` exists; use staging seeds + FIT4MOM / Mini Yoga watchlist rows for Sunnyvale inventory.

Each candidate is enriched toward a Puddles Events row:

- **cost** — defaults to `Free` (library programs)
- **address / lat / lng** — from branch location
- **ageRange** — mapped from BiblioCommons audiences (babies / toddlers / preschoolers)
- **types** — mapped from event type + title heuristics
- **tips** (“Good to know”) — practical notes extracted from registration fields and description (bring a blanket, weather/indoor-outdoor, registration/space limits, accompaniment, etc.). Discovery scripts voice tips in a friendly soft-imperative Puddles tone (`voiceTipLine` / `finalizeTips` in `scripts/discovery-shared.mjs`): keep “Bring a blanket,” drop library “we/our,” skip Admin ops notes.
- **imageUrl** — featured event image when present

### Optional Sheet write

If you enable **Also write Google Sheet** on Discovery, redeploy `google-apps-script/PuddlesSheetApi.gs` (Deploy → Manage deployments → New version) so `appendEventDraft` / `updateEventVerifiedDate` / `bulkUpdateEventVerifiedDate` are available. Default Approve does not need Apps Script.
