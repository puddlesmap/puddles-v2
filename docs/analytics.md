# Puddles analytics

Puddles uses [Plausible Analytics](https://plausible.io) for privacy-friendly usage tracking. No cookies, no personal data, admin routes excluded.

## Setup

Plausible loads **only on `puddlesmap.com`** via a shared bootstrap snippet:

- Next.js production (Netlify): [`src/app/layout.tsx`](../src/app/layout.tsx) loads [`PLAUSIBLE_BOOTSTRAP_SCRIPT`](../src/utils/plausibleSnippet.ts)
- Vite / `index.html`: same loader inline in [`index.html`](../index.html)

Localhost, Netlify preview URLs, and other hosts do **not** load the script.

On production, [`initAnalytics()`](../src/utils/analytics.ts) (from [`AppProviders`](../src/components/AppProviders.tsx) / Vite `App`) configures:

- **Outbound link** click tracking
- **Form submission** tracking (counts submissions only — no field values)
- Manual SPA pageviews (`autoCapturePageviews: false` — no double-counting on route changes)

[`trackPageView()`](../src/utils/analytics.ts) runs on Next route changes in [`ClientRoutePage`](../src/components/ClientRoutePage.tsx) and on Vite route changes in [`App.tsx`](../src/App.tsx).

No env var is required for production.

**Mobile vs desktop:** Plausible automatically breaks down visitors by device, browser, and OS in the dashboard. No custom code needed.

## Event catalog

All custom events use **snake_case**. Wire calls through [`trackEvent()`](../src/utils/analytics.ts) or the typed helpers in the same file.

### Pageviews

Tracked on route change for public pages only. The `page` property identifies the screen:

| Path | `page` |
|------|--------|
| `/` | `home` |
| `/browse` | `browse` |
| `/map` | `map` |
| `/event/:id` | `event_detail` |
| `/share` | `share` |
| `/about` | `about` |
| `/palo-alto`, `/los-altos`, `/mountain-view` | `city_page` (+ `city` prop) |

### Discovery behavior

| Event | Properties |
|-------|------------|
| `city_selected` | `city`, `context` (`home` \| `browse`) |
| `date_filter_selected` | `date_filter` (`today`, `tomorrow`, `this_weekend`, `anytime`), `context` |
| `activity_type_selected` | `activity_type` |
| `time_filter_selected` | `time_filter` |
| `age_filter_selected` | `age_filter` |
| `view_mode_changed` | `view_mode` (`list`, `map`) |

### Activity engagement

| Event | Properties |
|-------|------------|
| `activity_opened` | `event_id`, `event_city`, `event_category`, `source_context` |
| `visit_official_page_clicked` | `event_id`, `event_city`, `event_category` |
| `add_to_calendar_clicked` | same |
| `open_route_clicked` | same |
| `activity_shared` | same |

`source_context` values: `home`, `browse`, `map`, `city_page`

`event_category` slugs: `stories`, `music_movement`, `arts_crafts`, `build_explore`, `outdoor`, `social_play`, `classes`, `other`

### Community contribution

| Event | Properties |
|-------|------------|
| `share_form_opened` | `source_context` |
| `share_form_submitted` | `submission_type` (`event_tip`, `idea`, `feedback`) |
| `expansion_watch_submitted` | `requested_location` (bucketed), `source_context` |
| `outdated_info_reported` | `event_id`, `event_city`, `event_category` |

## Plausible goals to create

In Plausible → your site → **Settings → Goals**, add custom event goals for each event name above (15 goals). Pageviews are automatic.

Suggested reports:

- **Cities:** `city_selected` filtered by `city`
- **Date tabs:** `date_filter_selected` filtered by `date_filter`
- **Activity types:** `activity_type_selected` filtered by `activity_type`
- **Engagement funnel:** `activity_opened` → `visit_official_page_clicked` / `add_to_calendar_clicked` / `open_route_clicked`
- **Community:** `share_form_opened` vs `share_form_submitted`; `expansion_watch_submitted` by `requested_location`

Remove legacy V1 goals (`browse_filter_apply`, `event_open`, `share_submit`, etc.) after migration.

## Privacy rules (enforced in code)

- Script loads only on `puddlesmap.com`
- `/admin/*` is never tracked
- No emails, names, addresses, event titles, notes, child info, or submission text sent to analytics
- Long free-text strings and values containing `@` are stripped from custom properties
- Expansion watch `requested_location` is bucketed to in-market city slug or `other` — never raw ZIP/email
- Only enums and `event_id` as custom properties on activity events

## Manual verification

1. Open https://puddlesmap.com — DevTools → Network → filter `plausible` / `pa-qS64` and confirm the script loads
2. Open Plausible **Realtime** and confirm yourself as a visitor
3. Visit Home → Browse → Map → Event → Share → About; confirm `page` props
4. Change filters on Home and Browse; confirm discovery events
5. Open an activity from Home vs map; confirm `source_context`
6. Click official page, calendar, route, share; confirm engagement events
7. Submit share form and expansion watch; confirm no email in network payload
8. Confirm localhost and Netlify preview do **not** load the script

## Code map

| Concern | File |
|---------|------|
| Event constants + helpers | [`src/utils/analytics.ts`](../src/utils/analytics.ts) |
| Enum normalization | [`src/utils/analyticsMappers.ts`](../src/utils/analyticsMappers.ts) |
| Types | [`src/types/analytics.ts`](../src/types/analytics.ts) |
| Bootstrap snippet (prod host gate) | [`src/utils/plausibleSnippet.ts`](../src/utils/plausibleSnippet.ts) |
| Next.js script load | [`src/app/layout.tsx`](../src/app/layout.tsx) |
| Next.js pageview on route change | [`src/components/ClientRoutePage.tsx`](../src/components/ClientRoutePage.tsx) |
| Vite pageview / init | [`src/App.tsx`](../src/App.tsx) |
| Vite HTML fallback | [`index.html`](../index.html) |
