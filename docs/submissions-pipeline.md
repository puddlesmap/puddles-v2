# Submissions pipeline (V1)

Parents submit on the website → **Submissions** tab → admin dashboard review → approved events go to **Events** tab as **Draft** → set **Published** on Events tab → public site after sync.

## Flow

1. **Share form** POSTs to `/api/sheet-api` → Google Apps Script appends a row on **Submissions** (Status = New).
2. **Admin `/admin/submissions`** refreshes from the Submissions tab CSV, updates status, and sends approved events to the Events tab.
3. **Events tab** remains the publishing source. Set Status = **Published** (or legacy Approved) for live events.
4. **Scheduled sync** (`npm run sync-events`) updates the public site JSON.

## One-time setup

### 1. Google Apps Script

1. Open the [Events Data spreadsheet](https://docs.google.com/spreadsheets/d/1ko8p-HMzXMnSHT8qPxv14X-TPaac0RJTrfw8PwjikH8/edit).
2. **Extensions → Apps Script**
3. Replace `Code.gs` with [`google-apps-script/PuddlesSheetApi.gs`](../google-apps-script/PuddlesSheetApi.gs)
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **/exec** URL

### 2. Netlify environment

In Netlify → Site settings → Environment variables:

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | Yes | Web app /exec URL from step 1 |
| `PUDDLES_API_SECRET` | Recommended | Protects admin status updates + promote |
| `VITE_PUDDLES_API_KEY` | Same as secret | Sent from admin UI on write actions |

Redeploy after setting variables.

### 3. Local development

Copy `.env.example` to `.env.local`:

```bash
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
VITE_PUDDLES_API_KEY=your-secret   # optional, for admin actions
```

Run `npm run dev`. Share form and admin actions proxy to the script via `/api/sheet-api`.

For full Netlify parity locally: `netlify dev`.

### 4. Submissions tab columns

The Apps Script auto-adds missing headers on each new submission. Recommended column order:

| Column | Source |
|---|---|
| Submission ID | Auto-generated |
| Submitted Date | Form timestamp |
| Submission Type | Event or Idea |
| Status | Starts as **New** |
| Event Type | One-time event / Recurring class |
| Event Name | Form |
| Location Name | Combined place or address |
| Address | (optional; usually empty — location is in Location Name) |
| City | Form |
| Date | Form (one-time) |
| Start Time / End Time | Form |
| Age Range | Best for what age? |
| Cost Type / Cost Detail | Form cost step |
| Cost | Legacy summary (Free or detail) |
| Signup Requirement / Signup Link / Info | Form sign-up step |
| Event Description | What happens at the activity |
| Parent-to-Parent Tips | Insider tips |
| Category / Types | Idea types or tags |
| Link | Optional URL |
| Additional Info | Legacy (may mirror parent tips) |
| Internal Notes | Event type, recurring day, review flags |
| Converted Event ID | Set when promoted to Events tab |
| Submitted By Email | Parent email |

**Promote to Events** maps: title, venue, city, dates, cost, age → **Age Tags Clean**, description (event + parent tips + sign-up), and form notes → **Notes**.

## Submission statuses

| Status | Meaning |
|---|---|
| New | Just submitted |
| Needs review | Under review |
| Approved | Ready to send to Events tab |
| Added to sheet | Promoted to Events tab (see Converted Event ID) |
| Solved | Archived in admin — removed from active queue (row kept in sheet) |
| Rejected | Legacy dismissed status — still excluded from active queue |

Legacy sheet values **Reviewing** and **Converted** map to the new labels in the admin UI.

## Admin actions

### Submissions (`/admin/submissions`)

Each submission appears as a **table row**. Click the row to expand full details inline below it.

- **Refresh submissions** — pulls latest Submissions tab (no deploy needed)
- **Status dropdown** — writes to sheet via API
- **Send to Events tab** — available when Type = Event, Status = Approved; creates Events row as **Draft**
- **Solved** — sets Status to **Solved** in the sheet; removed from the active queue (filter **Solved** to review later)
- **Delete** — hides from this dashboard only; Google Sheet row is unchanged (filter **Hidden (dashboard only)** to restore)

### Events (`/admin/events`)

Each event appears as a **table row**. Click the row to expand full details inline below it.

- **Refresh** — pulls latest Events tab CSV
- **Hide from site** — sets Events tab `Status` to **Hidden** via `updateEventStatus` API (row stays in sheet; use Hidden Events view to find it)

After promoting, open the Events tab (or `/admin/events`), set **Status = Published**, then sync/deploy for the public site.

## Sheet API actions

| Action | Auth | Purpose |
|---|---|---|
| `appendSubmission` | Public | Share form intake |
| `updateSubmissionStatus` | API key | Admin status changes + Solved |
| `promoteSubmission` | API key | Send approved submission to Events tab |
| `updateEventStatus` | API key | Hide event (or other status change) |

Archived submissions and hidden events are **not deleted** from Google Sheets — they remain for your records. Dashboard-only deletes are stored in browser localStorage.

## Public site sync

Admin submission refresh is live. Public events still update via:

```bash
npm run sync-events   # or scheduled GitHub Action every 2 days
```

Then deploy.

## Troubleshooting

| Issue | Fix |
|---|---|
| Share form error “Sheet API not configured” | Set `GOOGLE_APPS_SCRIPT_URL` on Netlify and redeploy |
| Submission succeeds but admin shows empty | Click **Refresh submissions**; confirm Submissions tab is shared Viewer to anyone with link |
| Admin status update 401 | Set matching `PUDDLES_API_SECRET` and `VITE_PUDDLES_API_KEY` |
| Promote fails | Submission must be **Approved** and Type **Event**; check Apps Script execution log |
