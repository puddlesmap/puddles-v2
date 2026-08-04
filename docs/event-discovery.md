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

### Approve path (Phase 1)

1. Run `npm run discover:bay-area` (PA + Los Altos + Mountain View) or a single-city script → updates `src/data/discovery-candidates.json`
2. Open **Admin → Discovery** (`/admin/discovery`)
3. Edit title / tips (Good to know) / room / ages / types as needed
4. **Approve**
   - **New** → appends an Events Draft and stamps **Approved on** = today → Sheet **Last Checked Date**
   - **Already on site** → updates that Events row’s **Last Checked Date** (Verified on Puddles) — does not create a duplicate
5. Refresh Events from Sheet → Publish when ready → sync → live

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
- **tips** (“Good to know”) — practical notes extracted from registration fields and description (bring a blanket, weather/indoor-outdoor, registration/space limits, accompaniment, etc.)
- **imageUrl** — featured event image when present

### Apps Script deploy note

Approve requires Sheet API actions `appendEventDraft` and `updateEventVerifiedDate` in `google-apps-script/PuddlesSheetApi.gs`. After pulling this change, redeploy the Apps Script web app (Deploy → Manage deployments → edit → New version) so production gets the new actions.
