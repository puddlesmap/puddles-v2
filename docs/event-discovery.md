# Event discovery (roadmap)

Automated collection of family events (ages 0–5) for Puddles review, then publish.

## Best long-term path

| Phase | What | Storage |
|-------|------|---------|
| **0 — Experiment** | One-shot Palo Alto Library pull (next 14 days) | Local files in `data/discovery/` |
| **1 — Product** | Admin **Discovery** page + Sunday cron (60-day window) | Repo JSON (`src/data/discovery-candidates.json`); review in Admin |
| **2 — Scale** | Los Altos / Mountain View (+ city calendars you already use) | Same Admin pipeline |
| **3 — Only if needed** | Real database for multi-editor realtime | DB behind Admin |
| **Later optional** | All ops in Admin; retire day-to-day Google Sheets | DB = source of truth; Sheet = optional CSV export |

### Principles

1. **Human review** before anything goes live (no auto-Publish).
2. **Discovery queue is not the Events spreadsheet** — review in Admin; Sheet (or DB) only when promoting to Draft/Published.
3. **Library calendars first** (BiblioCommons / LibCal-style APIs), not whole-web search.
4. **Dedupe by official URL** so weekly runs stay small after the first pass.
5. **One publishing path** — Events → sync → site (unchanged until a full Admin/DB migration).

### Approve path (Phase 1)

1. Run `npm run discover:palo-alto` (or Sunday cron) → updates `src/data/discovery-candidates.json`
2. Open **Admin → Discovery** (`/admin/discovery`)
3. Edit title / tips (Good to know) / room / ages / types as needed
4. Set **Last checked** (defaults to today)
5. **Approve → Draft** → appends an Events row via Apps Script `appendEventDraft`
6. Refresh Events from Sheet → Publish when ready → sync → live

Dismiss keeps the candidate out of the pending queue (saved in this browser’s localStorage).

### Experiment / refresh queue

```bash
npm run discover:palo-alto
```

Writes dated CSV/JSON under `data/discovery/` **and** the Admin queue at `src/data/discovery-candidates.json`.

Each candidate is enriched toward a Puddles Events row:

- **cost** — defaults to `Free` (library programs)
- **address / lat / lng** — from branch location
- **ageRange** — mapped from BiblioCommons audiences (babies / toddlers / preschoolers)
- **types** — mapped from event type + title heuristics
- **tips** (“Good to know”) — practical notes extracted from registration fields and description (bring a blanket, weather/indoor-outdoor, registration/space limits, accompaniment, etc.)
- **imageUrl** — featured event image when present

### Apps Script deploy note

Approve requires the Sheet API action `appendEventDraft` in `google-apps-script/PuddlesSheetApi.gs`. After pulling this change, redeploy the Apps Script web app (new deployment or update existing) so production gets the new action.
