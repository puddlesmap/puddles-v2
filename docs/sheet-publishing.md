# Puddles Events Tab — Publishing Fields

The public website only displays events where **Is Live = TRUE**.

Google Sheet remains the source of truth. The admin dashboard edits **Status** only; **Is Past** and **Is Live** are computed.

## Fields

| Field | Editable | Role |
|---|---|---|
| **Status** | Yes (admin) | Editorial decision: Draft, Published, Hidden, Expired |
| **Is Past** | No (computed) | TRUE when event date/time has passed |
| **Is Live** | No (computed) | TRUE when Status = Published AND Is Past = FALSE |

## Status values

| Status | Meaning |
|---|---|
| Draft | Not ready or under review |
| Published | Approved for public display (if not past) |
| Hidden | Intentionally removed from public site |
| Expired | No longer relevant / manually archived |

## Public website rule

```
Show event  ⇔  Is Live = TRUE
             ⇔  Status = Published  AND  Is Past = FALSE
```

Hide when Status is Draft, Hidden, or Expired, or when Is Past = TRUE.

## Google Sheets formulas

Adjust column letters to match your Events tab layout.

### Is Past

Compare event end datetime to now:

```sheets
=OR(
  (DateCell + TimeEndCell) < NOW(),
  AND(DateCell <> "", TimeEndCell = "", DateCell < TODAY())
)
```

If date and end time are separate columns without time values, a simpler day-level check:

```sheets
=DateCell < TODAY()
```

### Is Live

```sheets
=AND(StatusCell="Published", IsPastCell=FALSE)
```

## Legacy Approved migration

Do not use **Approved** as the website publish gate.

When migrating existing rows:

| Legacy | New Status |
|---|---|
| Approved = FALSE | Draft |
| Approved = TRUE, Is Past = FALSE | Published |
| Approved = TRUE, Is Past = TRUE | Expired |
| Manually removed | Hidden |

After migration, rely on **Is Live = TRUE** for the website.

## Code references

| File | Purpose |
|---|---|
| `scripts/publishing.mjs` | Shared logic for `parse-sheet.mjs` |
| `src/utils/publishing.ts` | Runtime publishing helpers |
| `src/types/admin.ts` | Admin model, filters, saved views |
| `src/utils/adminEvents.ts` | Admin list filtering |
| `src/data/events.ts` | `LIVE_EVENTS` for public site, `ALL_EVENTS` for admin |

## Admin saved views

| View | Filter |
|---|---|
| Live Events | Is Live = TRUE |
| Draft Events | Status = Draft |
| Hidden Events | Status = Hidden |
| Expired Events | Status = Expired |
| Past Events | Is Past = TRUE |
| Needs Verification | Verification Status (future) |

## Rebuild public data

Sync from the **Events** tab (Google Sheet → CSV → `sheet-events.json`):

```bash
npm run sync-events
```

This script:

1. Fetches the Events tab CSV from [Events Data](https://docs.google.com/spreadsheets/d/1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8/edit) (gid configured in `data/sheet-source.json`)
2. Caches a copy at `data/events-export.csv`
3. Maps columns by header name (reference columns are ignored unless mapped)
4. Writes all rows to `src/data/sheet-events.json` with `Status`, `Is Past`, `Is Live`

The website loads only `LIVE_EVENTS` where `Is Live = TRUE`. Showcase demo events are used only when the sheet has zero live rows.

### Scheduled refresh

See [scheduled-sync.md](./scheduled-sync.md) for GitHub Actions cron setup (`/.github/workflows/sync-events.yml`).

### Sheet column mapping (Events tab)

| Sheet header | App field |
|---|---|
| Event ID / Softr Record ID | `id` |
| TItle / Title | `title` |
| Event description | `description` |
| Venue | `venue` |
| Address | `address` |
| City | `city` |
| Event Date / Start DateTime | `date`, `startTime`, `endTime` |
| Category Tags | `types` |
| Image URL / Event URL | `imageUrl`, `eventUrl` |
| Approved | → `status` (legacy) |
| Is Past / Is Live | publishing helpers |
| Last Checked Date | `verifiedDate` |
| Longtitide | `lng` (lat from venue lookup) |
