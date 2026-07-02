# Puddles analytics (V1)

Puddles uses [Plausible Analytics](https://plausible.io) for privacy-friendly usage tracking. No cookies, no personal data, admin routes excluded.

## Setup

Plausible loads from `index.html` only when the site is served on **`puddlesmap.com`**. Localhost, Netlify preview URLs, and other hosts do not load the script.

On production, `initAnalytics()` configures:

- **Outbound link** click tracking
- **Form submission** tracking (counts submissions only — no field values)
- Manual SPA pageviews (no double-counting on route changes)

No env var is required for production. Tracking stays off in local dev unless you explicitly test on the live domain.

## Plausible goals to create

In Plausible → your site → **Settings → Goals**, add custom event goals:

| Goal name | Answers |
|---|---|
| `event_open` | Which events get opened |
| `add_to_calendar` | Calendar downloads |
| `visit_official_page` | Official page clicks |
| `open_route` | Directions clicks |
| `event_share` | Native share usage |
| `share_submit` | Share form completions |
| `share_submit_error` | Share form failures |
| `report_outdated_open` | Report outdated funnel start |
| `report_outdated_submit` | Report outdated completions |
| `discovery_city_change` | Home city filter usage |
| `discovery_day_tab` | Home day tab usage |
| `browse_filter_apply` | Browse day/time/age/type filters |
| `browse_city_change` | Browse location changes |
| `browse_view_change` | List vs map |
| `browse_filters_reset` | Filter resets |
| `share_tab_change` | Activity vs idea tab |
| `location_bridge_shown` | Location bridge opens |
| `address_link_click` | Address link in modal (vs route card) |

Pageviews are automatic for `/`, `/browse`, `/share`, `/about`.

## Filtering by property

In Plausible, use **Filters → Properties** on any goal or pageview report:

- `city` — which cities are used
- `day` / `value` — date tab selections
- `filter` + `value` — browse filter type
- `view` — list or map
- `event_id` — which events are opened (ID only, no titles)
- `source` — where event opens came from (`discovery`, `browse_list`, `browse_map`)
- `type` — share submission type (`activity`, `idea`)
- `report_type` — outdated report reason

## Privacy rules (enforced in code)

- Script loads only on `puddlesmap.com` (not localhost or preview deploys)
- `/admin/*` is never tracked
- No emails, names, addresses, event titles, notes, child info, or submission text sent to analytics
- Long free-text strings and values containing `@` are stripped from custom properties
- Only enums and `event_id` as custom properties

## Manual verification

1. Deploy to production or use the live site at https://puddlesmap.com.
2. Browse the public site (not admin).
3. In Plausible → **Realtime**, confirm pageviews, outbound link clicks, form submissions, and custom events appear.
