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
3. **Library calendars first** (BiblioCommons / LibCal-style APIs), not whole-web search.
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

| Script | Source |
|--------|--------|
| `discover:palo-alto` | Palo Alto Library · BiblioCommons |
| `discover:los-altos` | SCCL Los Altos + Woodland branches |
| `discover:mountain-view` | Mountain View Library · LibCal |
| `discover:bay-area` | All three into one Admin queue |

Each candidate is enriched toward a Puddles Events row:

- **cost** — defaults to `Free` (library programs)
- **address / lat / lng** — from branch location
- **ageRange** — mapped from BiblioCommons audiences (babies / toddlers / preschoolers)
- **types** — mapped from event type + title heuristics
- **tips** (“Good to know”) — practical notes extracted from registration fields and description (bring a blanket, weather/indoor-outdoor, registration/space limits, accompaniment, etc.). Discovery scripts voice tips in a friendly soft-imperative Puddles tone (`voiceTipLine` / `finalizeTips` in `scripts/discovery-shared.mjs`): keep “Bring a blanket,” drop library “we/our,” skip Admin ops notes.
- **imageUrl** — featured event image when present

### Optional Sheet write

If you enable **Also write Google Sheet** on Discovery, redeploy `google-apps-script/PuddlesSheetApi.gs` (Deploy → Manage deployments → New version) so `appendEventDraft` / `updateEventVerifiedDate` / `bulkUpdateEventVerifiedDate` are available. Default Approve does not need Apps Script.
