# Browse event card — design comparison

Comparison of **current production** Puddles browse cards vs **Discovery v2**, **Discovery v3**, and **city-placement options** explored in August 2026 experiments.

**Audience:** Product, design, and engineering deciding what ships on `/browse`.

**Live mockups**

| Mockup | URL |
|--------|-----|
| Badge + pillar concepts | `/experiment/launch-expand-mockup` |
| Browse v2-2 (image bar) | `/experiment/browse-v2-mockup` |
| Browse v3 (body pillars) | `/experiment/browse-v3-mockup` |
| City placement A/B/C | `/experiment/browse-card-layout-mockup` |
| **Visual design reference** | `/experiment/browse-card-design-reference` |
| **Live vs Option 2** | `/experiment/browse-live-vs-option2` |
| Side-by-side v1 / v2-2 / v3 | `/experiment/launch-expand-mockup` (comparison grid) |

**Source files**

| Area | Files |
|------|-------|
| Production card (live) | `LiveBrowseEventCard.tsx` (matches deployed main), `src/views/browse-page.css` |
| Production card (in-progress) | `src/components/EventCard.tsx` — badge hierarchy WIP, not yet live |
| V2 card | `src/components/experiment/DiscoveryV2Card.tsx` |
| V3 card | `src/components/experiment/DiscoveryV3Card.tsx` |
| Shared body + city layouts | `src/components/experiment/DiscoveryCardBody.tsx` |
| Experiment styles | `src/views/experiment-launch-expand-mockup.css`, `src/views/experiment-browse-mockup.css` |
| Seasonal badges | `src/utils/seasonalEditorialBadges.ts`, `src/components/EventEditorialBadge.tsx` |
| Filter NEW | `src/config/activityTypeLaunch.ts`, `src/components/filters/ActivityTypeFilterPills.tsx` |

---

## Badge hierarchy (August 2026)

Three layers — keep them separate:

| Layer | Where | Purpose | Examples |
|-------|--------|---------|----------|
| **Image badge** | On photo (top-right) | Why this event is timely / featured | Fall Pick, Halloween Pick, Holiday Pick |
| **Metadata tag** | Card body (not on image) | What type of event it is | Festival, Parent & Me, Outdoor, Stories |
| **Filter NEW** | Activity-type filter pills | Highlights a newly added filter temporarily | NEW on Festivals & Community, Parent & Me until `2026-10-31` |

**Rules**

- **Never** put activity type or “NEW” on the event image.
- Image overlay pills are **age + cost only** (production browse).
- Seasonal editorial badges appear on seasonal discovery carousels and in v3 experiments when an event qualifies.
- Remove filter NEW entries from `activityTypeLaunch.ts` once a type is established.

---

## Production vs Option 2 (city-soft)

Side-by-side of **what is live on `/browse` today** vs **Option 2** (`DiscoveryV3Card` with `bodyLayout="city-soft"`).

**Live comparison page:** `/experiment/browse-live-vs-option2` (uses Jeff Center Free Family Play and four catalog events).

> **Note:** The live card matches `main` branch `EventCard` — category + age + cost on the image, no activity type in the body, no editorial badge on the browse grid. Local `EventCard.tsx` has in-progress badge-hierarchy changes that are **not deployed yet**.

### Card anatomy

**Live today** (e.g. Jeff Center Free Family Play)

```
┌─────────────────────────┐
│ [Social & Play][All ages][Free] │  ← category + age + cost on image
│         image           │
├─────────────────────────┤
│ TODAY · 9:30 AM         │
│ Jeff Center Free Family Play │
│ Oshman Family JCC - Jeff Center for Families… │  ← venue · city (truncates)
└─────────────────────────┘
```

**Option 2 (city-soft v3)**

```
┌─────────────────────────┐
│              🍂 Fall Pick │  ← seasonal badge only when relevant — no image pills
│         image           │
├─────────────────────────┤
│ TODAY · 9:30 AM         │
│ Jeff Center Free Family Play │
│ [📍 Palo Alto][All ages][Free][Social & Play] │  ← metadata pillar row
└─────────────────────────┘
     ↑ soft city chip (#f7f8f9, bold #484848) + pin
```

### What changed (checklist)

| Area | Live today | Option 2 |
|------|------------|----------|
| **Component** | `EventCard` (main) | `DiscoveryV3Card` + `DiscoveryCardBody` |
| **Image pills** | **Category + age + cost** (white pills, top-left) | **None** — clean image |
| **Image badge** | **None** on browse grid | Seasonal editorial when relevant (Fall / Halloween / Holiday Pick) |
| **Activity type** | **On image** as category pill (`Social & Play`) | **Body pillar** — lavender chip, not on image |
| **Age & cost** | On image | Body pillars (grey age, green/yellow price) |
| **Body: venue line** | `Venue · City` under title | **Removed** |
| **Body: city** | Buried in venue line — truncates | **First pillar** — soft chip + map pin |
| **Card body height** | Flexible | Fixed (`7.625rem` compact) |
| **Filter NEW** | On activity-type filters only | Same — not on cards |

### Badge logic

| Layer | Live today | Option 2 |
|-------|------------|----------|
| **Image badge** | Not used on browse grid | Seasonal picks only — Fall Pick (with leaf icon), Halloween Pick, Holiday Pick |
| **Activity type** | Category pill **on image** | Type pillar **in body** — never on image |
| **Filter NEW** | Small NEW on Festivals & Community, Parent & Me filters until established | Same |

**Live today:** browse cards carry **no editorial badge**. Activity type is the first pill on the photo. There is no “NEW · type” or “NEW · city” anywhere on cards.

**Option 2 (proposed hierarchy):**

- **Image** → why notice this (seasonal editorial only)
- **Body metadata** → what it is (city, age, cost, type pillars)
- **Filters** → temporary NEW on newly added activity types

Seasonal qualification rules live in `seasonalEditorialBadges.ts`. Mock feeds may curate badge counts via `buildBrowseMockupBadgePlan()` for demos.

### Why Option 2

- City scannable without reading through a truncated venue name
- Image uncluttered — type moves off the photo
- Structured metadata row always shows age, price, and type
- Editorial badges reserved for seasonal/timely picks

### Tradeoffs

- **Venue name dropped** from browse card (still on detail page)
- **More body chrome** — four pillar chips vs one location line
- **Category no longer on image** — parents scan type in the metadata row instead

---

## 1. Live production (Puddles browse)

**Where it ships:** `/browse`, `/map` grid — `EventCard` on `main` branch (see `LiveBrowseEventCard.tsx` for accurate mock).

### Card anatomy

```
┌─────────────────────────┐
│ [Category][Age][Free]   │  ← up to 3 white pills: activity type, age, cost
│         image           │
├─────────────────────────┤
│ TODAY · 9:30 AM         │  ← datetime (14px, bold, uppercase, #686868)
│ Jeff Center Free…       │  ← title (14px bold, 2 lines)
│ Oshman Family JCC · …   │  ← venue · city (14px, #686868, truncates)
└─────────────────────────┘
```

### Key traits

| Element | Behavior |
|---------|----------|
| **Image overlay** | Up to **3 pills**: **activity category**, **age**, **cost**. Category drops first if overflow. “Free” gets sunny tint. |
| **Image badge** | **None** on browse grid |
| **Body metadata** | Datetime + title + **venue · city** only — no activity type line |
| **Activity type** | **On image** as category pill |
| **Filter NEW** | On activity-type filters only (not on cards) |
| **City** | Bundled with venue — often truncated in narrow columns |
| **Card height** | Flexible body height |

### Parent scan order

1. Image + category/age/cost pills  
2. When  
3. What (title)  
4. Where (venue-heavy, may truncate)

### Strengths

- Familiar, live today  
- Category visible without opening card  
- Venue name helps disambiguate branches

### Weaknesses

- **Venue line truncates** — city buried after long venue name  
- **Image busy** — category + age + cost compete with photo  
- **No editorial signal** for seasonal/timely events on browse grid  
- **City not scannable** in grid layout

---

## 2. Discovery v2 (v2-2 default)

**Concept:** Move **age + price** to the image; keep body text-only; add a **discovery badge** on the image.

### Card anatomy (v2-2)

```
┌─────────────────────────┐
│ [All ages] [Free]  Fall Pick │  ← white pills left · seasonal badge right (when relevant)
│                         │
│         image           │
│                         │
├─────────────────────────┤
│ Sat, Aug 30 · 10:30 AM  │  ← datetime (lighter than production)
│ Storytime with…         │  ← title (15px, 2 lines)
│ Linden Tree · Los Altos │  ← venue · city (optional — removable)
└─────────────────────────┘
```

### Key traits

| Element | Behavior |
|---------|----------|
| **Image bar** | **Age + price** as white pills (left). **Seasonal editorial badge** (right) when relevant: Fall Pick, Halloween Pick, Holiday Pick. |
| **Body metadata** | No pillar row — `showPillars={false}`. Activity type not on image. |
| **Activity type** | In metadata pillars (v3) or filter discovery — not on image badge. |
| **City** | Still on venue line by default; city-layout experiments can drop it. |

### vs production

| | Production | V2-2 |
|---|------------|------|
| Image pills | Category + age + cost | Age + cost only |
| Discovery badge | Seasonal editorial only | Seasonal editorial only |
| Body pillars | — | — |
| Venue line | Yes | Yes (default) |

### Strengths

- Cleaner body — less repeated metadata.  
- Discovery badge highlights **seasonal/timely** picks without mixing in activity type.  
- Age/price scannable on image (Airbnb-style bar).

### Weaknesses

- **Activity type** lives in body metadata (v3 pillars) or filter NEW — not on the image.  
- Badge + pills still compete on image.  
- Same venue-line truncation issue as production unless city moves.

---

## 3. Discovery v3

**Concept:** **Discovery badge on image**; move **age, price, and activity type** into a **metadata pillar row** under the title; optionally drop the venue line.

### Card anatomy (default — venue line)

```
┌─────────────────────────┐
│ Fall Pick               │  ← seasonal editorial badge only on image
│                         │
│         image           │
│                         │
├─────────────────────────┤
│ SAT, AUG 30 · 10:30 AM  │  ← datetime
│ Train Day               │  ← title (15px, 2 lines, fixed body height)
│ Los Altos History… · LA │  ← venue · city (1 line)
│ [Age][Free][Festival]   │  ← styled metadata pillars
└─────────────────────────┘
```

### Key traits

| Element | Behavior |
|---------|----------|
| **Image** | Seasonal editorial badge only (Fall / Halloween / Holiday Pick). No NEW · type/city on cards. |
| **Body pillars** | Airbnb-inspired tinted chips: grey age, green/yellow/slate price, lavender type. |
| **Fixed body height** | `--discovery-v3-body-height: 9rem` (7.625rem when venue line removed). |
| **Activity type** | Always in pillar row (shortened to “Festival” in narrow cards). |
| **City** | Default: venue line. Experiments move city to pillars or plain text (below). |

### vs production

| | Production | V3 |
|---|------------|-----|
| Image pills | Age + cost | Badge only |
| Type visibility | Plain text line in body | Body type pillar |
| Price/age | Image | Body pillars |
| Body height | Flexible | Fixed (grid alignment) |
| Editorial layer | — | Discovery badge |

### Strengths

- **Clearest metadata row** — age, cost, and type always in one predictable place.  
- Image stays cleaner; badge carries editorial intent.  
- Fixed body height = **even card rows** in carousel/grid.  
- Type pillar supports new **Festivals & Community** and **Parent & Me** without image clutter.

### Weaknesses

- One extra body row vs v2 — tighter on small cards; pillars can truncate.  
- Venue line still noisy unless city moves out of it.  
- More CSS + component complexity.

---

## 4. City placement options (v3 body variants)

Explored because parents scan **city** before venue, and `Venue · City` truncates badly.

Mockup: `/experiment/browse-card-layout-mockup`

### Option 1 · Plain text label *(current recommendation)*

```
SAT, AUG 30 · 11:00 AM
Train Day
Palo Alto · All ages · Free · Festival
```

| Trait | Detail |
|-------|--------|
| City treatment | Plain text, **no pill** |
| Separator | Middle dots (`·`) |
| City weight | `#5a6168`, semibold — slightly darker than other items |
| Other meta | `#8b9399`, medium — age · cost · type as text |
| Venue line | **Removed** |

**Pros:** Lightest, cleanest, city readable without competing with tinted pills.  
**Cons:** Less scannable than chips if users expect pill affordance; type not color-coded.

---

### Option 2 · Soft filled city chip + pin

```
SAT, AUG 30 · 11:00 AM
Train Day
[📍 Palo Alto] [All ages] [Free] [Festival]
```

| Trait | Detail |
|-------|--------|
| City chip | Lightest fill of row (`#f7f8f9`), map pin icon, `--radius-pill`, **700 weight**, `#484848` text |
| Other pills | Standard tinted pillars (grey age, green free, lavender type) |
| Venue line | **Removed** |

**Pros:** City pops with pin; friendlier than outline; still structured.  
**Cons:** City chip may compete with age/price/type pills; one more visual element than Option 1.

---

### Option 3 · Outlined city pill

```
SAT, AUG 30 · 11:00 AM
Train Day
[Palo Alto] [All ages] [Free] [Festival]
     ↑ 2px inset outline, transparent fill, lighter text
```

| Trait | Detail |
|-------|--------|
| City chip | Transparent + **2px inset border** (`rgb(39 48 52 / 0.28)`) |
| Other pills | Filled tinted pillars |

**Pros:** Strong city boundary without fill weight.  
**Cons:** Outline reads heavier than Option 1; still competes with filled pills (prior iteration feedback).

---

### Retired / reference layouts

| Layout | Description |
|--------|-------------|
| **City on datetime line** | `SAT · 10:30 AM · CUPERTINO` — city uppercase, bold 700 on datetime row. |
| **Venue + city (current)** | `Los Altos History Museum · Los Altos` under title — production default. |

---

## 5. Side-by-side matrix

| Dimension | Production | V2-2 | V3 + Option 1 | V3 + Option 2 |
|-----------|------------|------|---------------|---------------|
| **Image: age/price** | On image | On image | — | — |
| **Image: activity type** | — | — | — | — |
| **Image: seasonal badge** | Seasonal modules only | When qualified | When qualified | When qualified |
| **Image: NEW · type/city** | Never | Never | Never | Never |
| **Body: venue line** | Yes | Yes (default) | No | No |
| **Body: city** | In venue line | In venue line | Plain text meta | Soft chip + pin |
| **Body: age/cost/type** | Type text; age/cost on image | Image only | Plain text meta | Pillar row |
| **Type always visible** | Yes (text line) | Implied | Yes (text) | Yes (pill) |
| **Fixed card body height** | No | Partial (v2 compact) | Yes | Yes |
| **Visual complexity** | Medium | Medium | **Low** | Medium |
| **City scannability** | Low (truncates) | Low | **High** | **High** |

---

## 6. Puddles design tokens (relevant)

From `src/index.css`:

| Token | Value | Used on cards |
|-------|-------|----------------|
| `--radius-pill` | 999px | Filter chips, meta pillars, city chips |
| `--radius-sm` | 12px | Stacked filter chips |
| `--radius-md` | 16px | Card corners, images |
| `--radius-button` | 23px | CTAs (not cards) |

**Pillar color language (v3 experiments)**

| Pillar | Background | Meaning |
|--------|------------|---------|
| Age | `#f0f0f0` | Neutral grey |
| Free | `#eef8f0` | Green |
| Paid / Low-cost | Slate / warm yellow | Price signal |
| Type | `#f3f0fa` | Lavender |
| City (soft) | `#f7f8f9` | Lightest — intentionally subtle |

---

## 7. Recommendation summary (Aug 2026)

**Card shell:** **Discovery v3** — badge on image, metadata pillars (or plain meta row) in body, fixed height for grid parity.

**City in body:** **Option 2 (soft city chip + pin)** — recommended on layout mockup; city is boldest readable signal in the pillar row. **Option 1 (plain text)** remains a lighter fallback if user testing finds Option 2 too busy.

**Keep from production:** Equal-height browse grid, 2-line title clamp, event image treatment (`EventImage` resolution order).

**Drop or defer:** Production-style category pill on image (redundant once type is in body). Full venue line on browse grid (keep venue for detail page / map).

---

## 8. Open questions

1. **V2 vs V3 for launch?** V2 is less body clutter but hides type unless badge says so. V3 is better for new activity types (Festivals & Community, Parent & Me).
2. **Compact grid / map variants** — do city options apply to `compact-grid` and map sheet cards, or browse grid only?
3. **Venue anywhere on card?** Subtitle tooltip, detail-only, or small meta under pillars for power users?
4. **Plain text vs pills for age/cost/type in Option 1** — currently only city is plain; age/cost/type are also plain in Option 1. Confirm that’s intended vs mixed (plain city + filled other pills).

---

## 9. Wireframe — full stack comparison

```
LIVE TODAY           V3 · OPTION 2
────────────         ─────────────
[Type][Age][$]       (no pills)     [🍂 Fall Pick when relevant]
   image                image
────────────         ─────────────
WHEN                 WHEN
Title                Title
Venue · City…        [📍City][Age][$][Type]
```

---

*Last updated: 2026-08-28 — reflects badge hierarchy cleanup, production `EventCard` (no category on image), and Option 2 city-soft as recommended v3 layout.*
