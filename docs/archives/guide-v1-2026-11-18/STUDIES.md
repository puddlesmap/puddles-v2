# Guide studies — research scope (approved)

Shared V2 UX + analytics ship on all Holiday Magic guides. Study cohorts differ.

## Study 1 — Guides vs Browse (unchanged)

**Question:** Save conversion and discovery paths for Guides vs Browse.

**Cohort**

- All **published** Guides vs Browse.
- Include each Guide only **on/after its own publication date** (Pacific calendar `publishOn`).
  - Lights: from `2026-11-11`
  - Stories: from `2026-11-19`
  - Hello New Year: from `2026-12-07`
- Filter / slice with `discovery_origin`, confirmed `activity_saved`, and guide-side `guide_slug` / `source_guide_slug` as needed.

Stories and Hello New Year publication schedule does **not** change Study 1’s definition — it only controls when those guides enter the Guide side of the comparison.

## Study 2 — V1 vs V2 behavioral impact (**Lights only**)

**Question:** Did Guide V2 change reading, navigation, clicks, map, hub, and saves vs Lights V1?

**Primary filter (required)**

```
guide_slug = holiday-lights-traditions
```

Do **not** put Stories or Hello New Year in Study 2’s primary cohort or comparison period. They still get V2 UX and emit the same analytics for product/ops; exclude them from this study’s dashboards and windows.

### Periods

| Window | Definition |
| --- | --- |
| **Lights V1** | From Lights publish **2026-11-11** (Pacific) through the **exact V2 production deploy boundary** (exclusive of post-deploy traffic). |
| **Lights V2** | From the **exact V2 production deploy timestamp** onward on the same `guide_slug`. |

### V2 deployment boundary (fill at ship)

| Field | Value |
| --- | --- |
| UTC | _TBD — record at production deploy_ |
| America/Los_Angeles | _TBD_ |
| git SHA | _TBD_ |
| Netlify deploy ID | _TBD_ |
| Notes | Boundary splits Lights V1 vs V2 only; staggered Stories / Hello dates are unrelated to this cut. |

### Comparable metrics (use where V1 history exists)

Compare V1 → V2 only when both sides have instrumentation:

- Reading / section reach — `$pageview`, `guide_section_viewed` (V2 adds `guide_engagement_summary`; treat that as V2-only)
- Section navigation — V1 may lack `guide_nav_clicked`; do not invent V1 zeros
- Event clicks — `guide_event_link_clicked` (+ V2 `guide_event_impression` as V2-only)
- Map interaction — V2 `guide_map_opened` / `guide_map_pin_clicked` (V1 had inline map, not these events → **V2-only**)
- Seasonal Hub clicks — V2 `guide_seasonal_hub_clicked` (V1 hero/footer CTAs were not this event → prefer V2-only unless a V1 proxy is explicitly defined)
- Successful saves — confirmed `activity_saved` with Guide attribution only where V1 actually fired it; V1 Guide-attributed Save was unreliable → do **not** treat missing V1 as zero

### V2-only metrics (report separately)

Keep these off the head-to-head table (or show as “V2 only — no V1 baseline”):

- `guide_engagement_summary` (`active_reading_seconds`, `max_scroll_percent`, `sections_reached_count`)
- `guide_nav_clicked`
- `guide_event_impression`
- `guide_map_opened`, `guide_map_pin_clicked`
- `guide_seasonal_hub_clicked`, `guide_collection_clicked`
- `guide_view_id`, `guide_version=v2`, `discovery_origin`, `save_surface`, `map_assisted`
- `activity_save_clicked` / `activity_save_blocked`
- Persistence-confirmed Guide Save funnel where V1 lacked equivalent events

**Rule:** Missing V1 data is **not comparable to zero**. Exclude from delta math; chart in a V2 diagnostics panel.

### Dashboard build notes

1. Filter every Study 2 insight by `guide_slug = holiday-lights-traditions` (and URL `/guides/holiday-lights-traditions` for replay/heatmaps).
2. Split series at the recorded V2 deploy timestamp.
3. Optional `guide_version` property exists on V2 events only — useful as a secondary check after deploy, not a substitute for the timestamp boundary on V1 traffic.
4. Stories / Hello New Year: shared instrumentation for Study 1 after each publish; **out of Study 2**.
