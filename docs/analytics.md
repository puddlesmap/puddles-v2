# Puddles analytics (V1)

Puddles uses [Plausible Analytics](https://plausible.io) for privacy-friendly usage tracking. No cookies, no personal data, admin routes excluded.

## Setup

1. Create a Plausible account and add your production domain (`puddlesmap.com`).
2. Set `VITE_PLAUSIBLE_DOMAIN` in Netlify environment variables to `puddlesmap.com`.
3. Redeploy the site. Tracking is disabled when the env var is unset (local dev).

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

- `/admin/*` is never tracked
- No emails, addresses, event titles, or submission text sent to analytics
- Only enums and `event_id` as custom properties

## Manual verification

1. Set `VITE_PLAUSIBLE_DOMAIN` in `.env.local` and run `npm run dev`.
2. Browse the public site (not admin).
3. In Plausible → **Realtime**, confirm pageviews and custom events appear.
