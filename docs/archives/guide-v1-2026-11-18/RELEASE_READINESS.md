# Guide V2 + analytics — release readiness

**Status:** Implementation complete in branch; **not deployed to production**. Awaiting explicit approval.

## V1 archive

| Item | Value |
| --- | --- |
| Archive | [`docs/archives/guide-v1-2026-11-18/`](./) |
| Production SHA verified | `ff5757272e87fa4303b7bcae1654a160e9644d45` (`origin/main`) |
| Netlify deploy ID | Unavailable in this environment |
| Screenshots | Desktop + mobile hero of live Holiday Lights V1 |

## UX shipped (V2)

Applies to all three Holiday Magic guides:

- `/guides/holiday-lights-traditions`
- `/guides/holiday-stories-play` (catalog now `live`)
- `/guides/hello-new-year` (catalog now `live`)

Baseline: Guide F + shell H + map explore overlay G, event-level Save, collection CTA in footer, no Guide Save heart, Share status feedback (“Link copied” / “Shared”).

**Hub vs Collection destinations (verified):**

| CTA | Destination | Event |
| --- | --- | --- |
| “Explore Holiday magic hub →” (`MoreFromCollectionGuides`) | `/seasonal/holiday-magic` | `guide_seasonal_hub_clicked` |
| Footer “Browse all N holiday outings →” | `/seasonal/holiday-magic#events` | `guide_collection_clicked` |

## Analytics inventory

### Reused

`$pageview` (guide / browse / saved / event_detail), `guide_section_viewed`, `guide_event_link_clicked`, `activity_opened`, `activity_saved`, `guide_shared`, `add_to_calendar_clicked`, `visit_official_page_clicked`.

### Added

`guide_engagement_summary`, `guide_nav_clicked`, `guide_event_impression`, `guide_map_opened`, `guide_map_pin_clicked`, `guide_seasonal_hub_clicked`, `guide_collection_clicked`, `activity_save_clicked`, `activity_save_blocked`.

### Shared properties

`discovery_origin` (first-touch guide\|browse), `save_surface`, `source_guide_slug`, `guide_view_id`, `guide_version=v2`, optional `map_assisted`.

### Save persistence rule

`activity_saved` fires only after `localStorage` write + read-back confirmation. Heart click alone is `activity_save_clicked`. Failures → `activity_save_blocked` (`persist_failed` / `persist_error` / `sync_failed`). Anonymous Save remains allowed.

### Attribution example

Guide map pin → Event Detail → Save:

- `discovery_origin=guide`
- `map_assisted=true`
- `save_surface=event_detail` (not `guide_map`)
- `source_guide_slug` + `guide_view_id` retained for the visit

## Journey checklist (code-wired)

| # | Journey | Wired |
| --- | --- | --- |
| 1 | Guide → Read → Save → Saved | Yes (`guide_article` + Saved `$pageview`) |
| 2 | Guide → Map → Event → Save | Yes (map open/pin + map Save or detail Save + `map_assisted`) |
| 3 | Guide → Event Detail → Save | Yes (`from_guide` + `save_surface=event_detail`) |
| 4 | Guide → Seasonal Hub | Yes (`guide_seasonal_hub_clicked`) |
| 5 | Browse → Event → Save | Yes (`beginBrowseVisit`, `from_source`, browse save surfaces) |
| 6 | Signed-out → Sign In → Save | Anonymous Save works; sign-in from `/saved`; sync failures tracked as blocked |
| 7 | Saved visitor → Return to Saved | `$pageview` `page=saved` |

## Test results

| Check | Result |
| --- | --- |
| Production SHA vs `origin/main` | Match `ff57572…` |
| `node scripts/verify-save-persistence.mjs` | Pass |
| Local Next.js interactive journeys | **Blocked** — host EMFILE (too many open files) caused Next route 404s in this environment |
| PostHog Live property inspection | **Deferred** to Netlify Preview / production after deploy approval |

## Known limitations

1. `guide_map_preview_viewed` not fired — V2 has no passive inline map preview; only intentional `guide_map_opened`.
2. Netlify production deploy ID for V1 archive not captured here.
3. Full desktop/mobile PostHog Live QA must be re-run on a Preview deploy (or after prod approval) because local Next watching failed under EMFILE.
4. Pre-existing TS errors remain in unrelated files (`SavedRemindersAccordion`, image attribution).

## Studies measurable after this ship?

| Study | Measurable? |
| --- | --- |
| Study 1 — Guide vs Browse Save conversion | Yes, once Live events ingest (`discovery_origin` + confirmed `activity_saved`) |
| Study 2 — Guide V2 engagement / map / hub / saves | Yes for V2 diagnostics; V1 historical Save rate remains unavailable |

## Do not deploy until approved

After approval, record: UTC + Pacific deploy time, git SHA, Netlify deploy ID, affected Guide URLs, analytics validation status.
