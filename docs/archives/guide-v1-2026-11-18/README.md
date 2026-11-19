# Guide UX — V1 archive (2026-11-18)

Snapshot of production Guide UX and tracking before V2 work in the local tree.

## Reference

| Item | Value |
| --- | --- |
| Production git SHA | `ff5757272e87fa4303b7bcae1654a160e9644d45` (matches `origin/main` and local HEAD before V2) |
| Live URL | https://puddlesmap.com/guides/holiday-lights-traditions |
| Netlify deploy ID | Unavailable in this environment (`gh` CLI missing; `curl` to site returned bot 403 for headers) |
| Screenshots | `v1-holiday-lights-desktop-hero.png`, `v1-holiday-lights-mobile-hero.png` |

## V1 UX (production)

- **Hero:** `GuideEditorialHero` / `HolidayGuideIntro` card with yellow “Explore holiday activities →” CTA in hero.
- **Section index:** Thumbnail/pill “In this guide” (Lights & Walks, Town Celebrations, Santa Visits, Train Rides, Before you go).
- **Map:** Inline “Where the Holiday Magic Happens” `GuidePlacesMap` (not overlay G).
- **Event recommendations:** `FeaturedExperience` style; Open on Puddles links.
- **Save:** No reliable Guide-attributed `activity_saved`; Guide Save heart not required for V2 comparison; event-level Save not the primary V1 planning action.
- **Seasonal:** Hero CTA + footer “Explore holiday activities” → holiday collection.
- **Sibling guides:** “More from Holiday magic” coming soon cards.

## Tracking

**Works on V1**

- `$pageview` (guide)
- `guide_section_viewed`
- `guide_event_link_clicked`
- `guide_shared`
- `activity_opened` (with `from_guide`)

**Missing or unreliable**

- `discovery_origin`, `save_surface`, `guide_view_id`, `guide_version`, `guide_engagement_summary`
- `guide_event_impression`, `guide_map_*`, `guide_nav_clicked`, `guide_seasonal_hub_clicked`, `guide_collection_clicked`
- `activity_save_clicked` / `blocked`, Guide-attributed `activity_saved`

## V2 note

V2 ships Guide **F**, shell **H**, and map explore overlay **G** from the local working tree (post this SHA).

**Study 2** (V1 vs V2 behavioral impact) uses **Holiday Lights only** (`holiday-lights-traditions`), split at the recorded V2 production deploy timestamp. See [`STUDIES.md`](./STUDIES.md).