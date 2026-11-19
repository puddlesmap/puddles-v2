# Puddles analytics

Puddles uses dual analytics on production (`puddlesmap.com`):

- [Plausible](https://plausible.io) — privacy-friendly web analytics (no cookies)
- [PostHog](https://posthog.com) — product analytics (funnels, retention; anonymous distinct ID)

Admin routes are excluded from both.

## Setup

### Plausible

Plausible loads **only on `puddlesmap.com`** via a shared bootstrap snippet:

- Next.js production (Netlify): [`src/app/layout.tsx`](../src/app/layout.tsx) loads [`PLAUSIBLE_BOOTSTRAP_SCRIPT`](../src/utils/plausibleSnippet.ts)
- Vite / `index.html`: same loader inline in [`index.html`](../index.html)

Localhost, Netlify preview URLs, and other hosts do **not** load the script.

On production, [`initAnalytics()`](../src/utils/analytics.ts) (from [`AppProviders`](../src/components/AppProviders.tsx) / Vite `App`) configures:

- **Outbound link** click tracking
- **Form submission** tracking (counts submissions only — no field values)
- Manual SPA pageviews (`autoCapturePageviews: false` — no double-counting on route changes)

[`trackPageView()`](../src/utils/analytics.ts) runs on Next route changes in [`ClientRoutePage`](../src/components/ClientRoutePage.tsx) and on Vite route changes in [`App.tsx`](../src/App.tsx).

No env var is required for Plausible on production.

**Mobile vs desktop:** Plausible automatically breaks down visitors by device, browser, and OS in the dashboard. No custom code needed.

### PostHog

Initialized in [`instrumentation-client.ts`](../instrumentation-client.ts) when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set. Events go through the `/ingest` reverse proxy via **Netlify redirects** in [`netlify.toml`](../netlify.toml) (not Next.js rewrites — those break PostHog on Netlify). **`NEXT_PUBLIC_POSTHOG_HOST` is not required**.

**Netlify env (required for production):**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Project API Key (`phc_…`) from PostHog → Project settings |

Optional local debug:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_POSTHOG_DEBUG` | `true` to allow PostHog on `localhost` / `127.0.0.1` only |

After changing env vars, **trigger a new deploy** so the public token is baked into the client bundle.

**Policy (product analytics):**

- Canonical event names match Plausible / code (`activity_opened`, `add_to_calendar_clicked`, etc.) — **no alias duplicates**
- Manual SPA `$pageview` via [`trackPageView()`](../src/utils/analytics.ts) only (`capture_pageview: false`)
- Autocapture off; masked session replay and heatmaps on for the public site; `/admin` does not record; no automatic `identify()` for public visitors
- Optional admin-only control: “Mark this browser as internal” → `identify('schei_internal', { is_internal: true, user_type: 'owner' })` (no email/name)
- No names, emails, form content, or precise location (existing prop sanitizer)
- Production capture on `puddlesmap.com` only (unless `NEXT_PUBLIC_POSTHOG_DEBUG=true` on localhost)

Suggested PostHog insights:

- Funnel: `$pageview` → `activity_opened` → (`add_to_calendar_clicked` OR `visit_official_page_clicked` OR `activity_shared`)
- Seasonal: `seasonal_banner_impression` → (`seasonal_banner_clicked` OR `seasonal_collection_event_opened`) → `activity_opened`
- Weekly retention: `activity_opened` → return with `activity_opened`
- Weekly trends: `$pageview`, `activity_opened`, `add_to_calendar_clicked`, `visit_official_page_clicked`

## Event catalog

All custom events use **snake_case**. Wire calls through [`trackEvent()`](../src/utils/analytics.ts) or the typed helpers in the same file.

### Pageviews

Tracked on route change for public pages only. The `page` property identifies the screen:

| Path | `page` |
|------|--------|
| `/` | `home` |
| `/browse` | `browse` |
| `/browse?view=map`, `/map` | `map` |
| `/event/:id` | `event_detail` |
| `/share` | `share` |
| `/about` | `about` |
| `/saved` | `saved` |
| `/guides` | `guides` |
| `/palo-alto`, `/los-altos`, `/mountain-view`, `/sunnyvale` | `city_page` (+ `city` prop) |
| `/guides/:slug` | `guide` (+ `guide_slug`, `entry_point`) |
| `/seasonal`, `/seasonal/:slug`, `/experiment/seasonal-discovery/:slug` | `seasonal_collection` (+ `collection_slug`) |

City, activity, and age query changes do not send another pageview. Those chips already have their own events. Switching to the map does, once.

A guide visit is this `$pageview`. There is no second `guide_viewed` event. `entry_point` is an allowlist: `utm_source` when it is `instagram`, `xiaohongshu`, or `google` (also `ig`, `xhs`, `redbook`); otherwise `entry=home`, `entry=browse`, or `entry=collection`; otherwise a same-site referrer; otherwise `direct`. The seasonal guide card uses `?entry=collection`. The shared URL has no tracking parameters.

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
| `activity_opened` | `event_id`, `event_city`, `event_category`, `source_context`, optional `guide_slug` |
| `visit_official_page_clicked` | `event_id`, `event_city`, `event_category` |
| `add_to_calendar_clicked` | same |
| `open_route_clicked` | same |
| `activity_shared` | same |

`source_context` values: `home`, `browse`, `map`, `city_page`, `guide`

`event_category` slugs: `stories`, `music_movement`, `arts_crafts`, `build_explore`, `outdoor`, `social_play`, `classes`, `other`

### Seasonal banner (Home)

| Event | Properties |
|-------|------------|
| `seasonal_banner_impression` | `theme_slug` (`hello_fall`, …), `placement` (`home`), `page` (`home`) — once per mount when ≥35% visible |
| `seasonal_banner_clicked` | `theme_slug`, `click_target` (`see_all`), `placement`, `page` — See all → collection |
| `seasonal_collection_event_opened` | `event_id`, `event_city`, `event_category`, `theme_slug`, `placement`, `page` — card in the banner carousel |

Wired on the Home Hello Fall band via [`SeasonalDiscoveryModule`](../src/components/seasonal/SeasonalDiscoveryModule.tsx). Opening a card still also fires `activity_opened` from the event detail view.

### Local guides (Guide V2 studies)

| Event | Properties |
|-------|------------|
| `$pageview` | `page` (`guide`), `guide_slug`, `entry_point` |
| `guide_engagement_summary` | `guide_slug`, `guide_view_id`, `guide_version`, `active_reading_seconds`, `max_scroll_percent`, `sections_reached_count` — once per Guide visit on exit |
| `guide_section_viewed` | `guide_slug`, `section_id`, `guide_view_id`, `guide_version` — once per section per visit |
| `guide_nav_clicked` | `guide_slug`, `section_id`, `nav_placement` (`mobile_sticky` \| `desktop_toc` \| `index`) |
| `guide_event_impression` | `guide_slug`, `event_id`, `placement`, optional `section_id` — once per event/placement/visit (≥35% visible) |
| `guide_event_link_clicked` | `guide_slug`, `event_id`, optional `placement` / `section_id`, `guide_view_id` |
| `guide_map_opened` | `guide_slug`, `guide_view_id` — intentional overlay open (not a passive preview) |
| `guide_map_pin_clicked` | `guide_slug`, `place_slug`, optional `event_id`, `guide_view_id` — user pin/list select (auto-select suppressed) |
| `guide_seasonal_hub_clicked` | `guide_slug`, `cta_placement`, `destination_type=seasonal_hub`, `destination_path` (`/seasonal/holiday-magic`) |
| `guide_collection_clicked` | `guide_slug`, `cta_placement`, `destination_type=collection`, `destination_path` (`…#events`) |
| `guide_shared` | `guide_slug` |

#### Study dashboards (PostHog)

Full rules: [`docs/archives/guide-v1-2026-11-18/STUDIES.md`](./archives/guide-v1-2026-11-18/STUDIES.md).

| Study | Filter / cohort |
|-------|-----------------|
| **Study 1 — Guides vs Browse** | All published Guides vs Browse; include each Guide only after its own Pacific `publishOn`. Unchanged by Study 2 Lights-only clarification. |
| **Study 2 — V1 vs V2 behavioral impact** | **`guide_slug = holiday-lights-traditions` only.** V1 window: 2026-11-11 through the recorded V2 production deploy timestamp. V2 window: after that timestamp. Stories / Hello New Year are out of this cohort even after they publish. |

Comparable Study 2 metrics (reading/sections, event clicks, and saves **only where V1 history exists**). Keep V2-only events (`guide_engagement_summary`, map overlay, hub/collection named events, `guide_nav_clicked`, impressions, persistence Save funnel props) in a **separate** panel — do not treat missing V1 as zero.

### Save (Guide vs Browse)

| Event | Properties |
|-------|------------|
| `activity_save_clicked` | `event_id`, `save_surface`, `intended_saved`, plus attribution props |
| `activity_save_blocked` | `event_id`, `reason` (`persist_failed` \| `persist_error` \| `sync_failed`), `save_surface`, attribution |
| `activity_saved` | Confirmed localStorage persistence only: `event_id`, `saved` (`true`\|`false`), `save_surface`, `discovery_origin`, optional `source_guide_slug`, `guide_view_id`, `guide_version`, `map_assisted` |

`save_surface`: `guide_article` \| `guide_map` \| `browse_list` \| `browse_map` \| `event_detail`.

`discovery_origin` is first-touch Guide or Browse for the session visit (separate from `save_surface`). Map pin → Event Detail → Save keeps `discovery_origin=guide`, `map_assisted=true`, and `save_surface=event_detail`.

After `activity_opened` includes `guide_slug`, later official-site, calendar, and directions clicks for that event carry the same `guide_slug`.

## Seasonal Hub — Holiday Magic

Create this in the PostHog UI, project `517281`. Name the dashboard **Seasonal Hub — Holiday Magic**.

Build this dashboard **before** deploying Guide V2 / hub-related analytics so baselines and funnels exist on day one. Keep Study 1 / Study 2 and **Local Guides — Halloween** as separate dashboards; join only on shared props (`guide_slug`, `guide_view_id`).

### Trends / breakdowns

- `$pageview` where `page` = `seasonal_collection` and `collection_slug` = `holiday_magic` (device: desktop vs mobile)
- `$pageview` where `page` = `guide` and `entry_point` = `collection` (breakdown by `guide_slug`)
- `guide_seasonal_hub_clicked` and `guide_collection_clicked` (Guide → Hub / `#events`)

### Funnel A — Hub → Guide → plan (one session)

1. `$pageview` where `page` = `seasonal_collection` and `collection_slug` = `holiday_magic`
2. `$pageview` where `page` = `guide` and `entry_point` = `collection`  
   (upgrade later to `seasonal_hub_guide_clicked` if that event ships)
3. `guide_event_link_clicked`
4. `activity_opened` where `source_context` = `guide`
5. `activity_saved` where `discovery_origin` = `guide`  
   **or** engagement: `visit_official_page_clicked` / `add_to_calendar_clicked` / `open_route_clicked` with `guide_slug`

### Funnel B — Hub → Event (direct; coarse until hub `source_context` ships)

1. `$pageview` where `page` = `seasonal_collection` and `collection_slug` = `holiday_magic`
2. `activity_opened` (today hub opens often look like `source_context` = `home` — treat as approximate)
3. Save or engagement as above

### Known gaps (dashboard still useful)

- No Hub → Guide click event yet (infer via guide `$pageview` `entry_point=collection`)
- Hub event opens are not distinctly labeled vs Home
- Live Home teaser does not fire `seasonal_banner_*`

Replay filter: URL contains `/seasonal/holiday-magic`. Heatmaps: that hub + holiday guide URLs. Replay stays masked. Autocapture stays off.

## Local Guides — Halloween

Create this in the PostHog UI, project `517281`. Name the dashboard **Local Guides — Halloween**.

Funnel, within one session:

1. `$pageview` where `page` = `guide` and `guide_slug` = `halloween-with-little-ones`
2. `guide_event_link_clicked` with the same `guide_slug`
3. `open_route_clicked` OR `visit_official_page_clicked` OR `add_to_calendar_clicked`, same `guide_slug`

Replay filter: visited URL contains `/guides/halloween-with-little-ones`. Heatmaps: that guide, `/`, and `/browse`. Replay stays masked. Autocapture stays off.

### Community contribution

| Event | Properties |
|-------|------------|
| `share_form_opened` | `source_context` |
| `share_form_submitted` | `submission_type` (`event_tip`, `idea`, `feedback`) |
| `expansion_watch_submitted` | `requested_location` (bucketed), `source_context` |
| `outdated_info_reported` | `event_id`, `event_city`, `event_category` |

## Plausible goals to create

In Plausible → your site → **Settings → Goals**, add custom event goals for each event name above (18 goals). Pageviews are automatic.

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
2. Filter Network for `ingest` and confirm PostHog requests succeed (after token + redeploy)
3. Open Plausible **Realtime** and PostHog **Activity** / Live; confirm yourself as a visitor
4. Visit Home → Browse → Map → Event → Share → About; confirm `page` props / `$pageview`
5. Change filters on Home and Browse; confirm discovery events
6. Open an activity from Home vs map; confirm `activity_opened` (same name in Plausible + PostHog)
7. Click official page, calendar, route, share; confirm `visit_official_page_clicked` / `add_to_calendar_clicked` / `activity_shared`
8. Submit share form and expansion watch; confirm no email in network payload
9. Confirm localhost does **not** send analytics unless `NEXT_PUBLIC_POSTHOG_DEBUG=true` (PostHog only); Netlify previews do not track

## Code map

| Concern | File |
|---------|------|
| Event constants + helpers | [`src/utils/analytics.ts`](../src/utils/analytics.ts) |
| Enum normalization | [`src/utils/analyticsMappers.ts`](../src/utils/analyticsMappers.ts) |
| Types | [`src/types/analytics.ts`](../src/types/analytics.ts) |
| Bootstrap snippet (prod host gate) | [`src/utils/plausibleSnippet.ts`](../src/utils/plausibleSnippet.ts) |
| PostHog client init | [`instrumentation-client.ts`](../instrumentation-client.ts) |
| PostHog `/ingest` proxy | [`netlify.toml`](../netlify.toml) |
| Next.js script load | [`src/app/layout.tsx`](../src/app/layout.tsx) |
| Next.js pageview on route change | [`src/components/ClientRoutePage.tsx`](../src/components/ClientRoutePage.tsx) |
| Vite pageview / init | [`src/App.tsx`](../src/App.tsx) |
| Vite HTML fallback | [`index.html`](../index.html) |
