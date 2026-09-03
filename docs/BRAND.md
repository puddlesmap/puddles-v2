# Puddles brand reference

Canonical guide for **copy, SEO, and images** used on [puddlesmap.com](https://puddlesmap.com).  
When updating public-facing language, change the source file listed here — then update this doc if the live copy changes.

---

## Brand identity

| Element | Production value |
|--------|------------------|
| **Name** | Puddles |
| **Tagline** | the tot map |
| **Full lockup** | Puddles · the tot map |
| **Domain** | https://puddlesmap.com |
| **Audience** | Parents and caregivers of children ages 0–5 |
| **Geography** | Bay Area → Palo Alto, Los Altos, Mountain View, Sunnyvale |
| **Theme color** | `#FFFFFF` |

**Source:** `src/config/site.ts`, `src/components/layout/BrandLockup.tsx`

---

## Voice & terminology

| Use | Avoid (in parent-facing UI) |
|-----|------------------------------|
| **activities** | events (for lists, counters, filters) |
| **local moments** | — (brand phrase; keep sparingly) |
| **storytimes, music, drop-ins** | — (concrete activity types parents search for) |
| **free / low-cost / drop-in** | — (signals low commitment) |
| **ages 0–5** | toddlers only (unless context-specific) |

**Good-to-know tips** (Discovery extract): friendly soft-imperative parent notes — “Bring a blanket,” “No registration — just show up.” Prefer practical prep over library “we invite…” copy. Applied in `scripts/discovery-shared.mjs` → `finalizeTips`.

**Exception:** “library events” is OK in descriptive copy (e.g. home subtitle). Individual listings may still use “event” in URLs (`/event/:id`) and internal data models.

**List counter pattern:** `162 upcoming activities` — `src/utils/browseResultsCopy.ts`

---

## Production page copy

### Home (`/`)

| Role | Copy |
|------|------|
| **Headline** | Find storytimes, music, drop-ins, and local moments for ages 0–5. |
| **Subtitle** | Bay Area activities, from free library events to low-cost community programs. |
| **CTA title** | Know a small local moment? |
| **CTA body** | Share a storytime, a parent-friendly tip, or an idea for Puddles. |
| **Filter summary** | `All cities · 12 activities` / `Palo Alto · 3 activities` / `Nearby · 5 activities` |
| **Map footer** | Nearby cities · Palo Alto · Los Altos · Mountain View · Near you |

**Sources:**
- Headline + subtitle + CTA: `src/pages/homeExperimentAccentShared.ts`
- Filter summary: `src/utils/browseResultsCopy.ts` → `getHomeFilterResultsSummary`
- Map labels: `src/pages/homeMapPreview.ts`

---

### About (`/about`)

| Role | Copy |
|------|------|
| **Tagline** | It takes a village — here's where to find it. |
| **Opening** | Puddles the tot map started with a simple question: What can we do today, without planning too much? |
| **Pillars** | Made for today · Low commitment · Close to home |
| **Community heading** | We're just getting started |
| **CTA title** | Know a small local moment? |
| **CTA body** | Share a storytime, a parent-friendly tip, or an idea for Puddles. |

**Source:** `src/pages/aboutShared.ts`

---

### Browse & map (`/browse`, `/map`)

| Role | Copy |
|------|------|
| **SEO title** | Browse Bay Area Activities · Puddles |
| **Map SEO title** | Map · Puddles |
| **Results line** | `{n} upcoming activities` |

**Sources:** `src/utils/siteMeta.ts`, `src/utils/browseResultsCopy.ts`

---

### City landing pages (`/palo-alto`, `/los-altos`, `/mountain-view`)

| Role | Copy |
|------|------|
| **H1** | `{City} activities for ages 0–5` |
| **SEO title** | `{City} Activities for Ages 0–5 \| Puddles` |
| **SEO description** | Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0–5 in {City}. |
| **Intro** | Puddles lists upcoming storytimes, music sessions, drop-ins, library events, and community programs for ages 0–5 in {City}. |

**Source:** `src/config/localRoutes.ts`, `src/pages/CityLandingPage.tsx`

---

### Share (`/share`)

| Role | Copy |
|------|------|
| **SEO title** | Share with Us · Puddles |
| **Activity intro** | Know a great local activity? Share it with nearby families. |
| **Idea intro** | What would make Puddles more helpful? |
| **Success heading** | Thanks for helping out! |

**Source:** `src/pages/SharePage.tsx`

---

### Activity detail (`/event/:id`)

| Role | Copy |
|------|------|
| **Title** | `{Activity title} in {City} · Puddles` |
| **Meta description** | `{title} on {date} at {venue} in {city}. Find local activities for ages 0–5 with Puddles.` |
| **Unavailable** | This activity is no longer listed on Puddles. (noindex) |

**Source:** `src/utils/eventPages.ts`, `src/utils/siteMeta.ts`

---

### Utility pages

| Route | SEO title |
|-------|-----------|
| `/about` | About · Puddles |
| 404 | Page Not Found · Puddles |
| `/maintenance` | Maintenance · Puddles |

---

## SEO & social (internet-facing)

### Global defaults

| Field | Value |
|-------|-------|
| **Site title** | Puddles \| Bay Area Activities for Ages 0–5 |
| **Meta description** | Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0–5 in the Bay Area. Starting in Palo Alto, Los Altos, Mountain View, and Sunnyvale. |
| **OG description** | Same as meta, without “Starting in Palo Alto…” |
| **OG image** | https://puddlesmap.com/og-image.png |
| **Twitter card** | summary_large_image |
| **Canonical** | https://puddlesmap.com (home) |

**Sources:** `src/config/site.ts`, `index.html` (static fallback for crawlers before JS), `src/utils/siteMeta.ts` (runtime)

### Title pattern

`{Page name} · Puddles` — `formatDocumentTitle()` in `src/utils/siteMeta.ts`

Home uses the full site title (not the short pattern).

### Indexing

| Indexed | Not indexed |
|---------|-------------|
| `/`, `/browse`, `/map`, `/share`, `/about` | `/admin/*` |
| `/palo-alto`, `/los-altos`, `/mountain-view` | Experiment routes |
| `/event/{id}` (public activities) | Unavailable activity pages |

**Sources:** `public/robots.txt`, `public/sitemap.xml`, `src/utils/siteMeta.ts`

### PWA manifest

| Field | Value |
|-------|-------|
| **name** | Puddles · The Tot Map |
| **short_name** | Puddles |
| **description** | Find storytimes, music, drop-ins, library events, community programs, and local family activities for ages 0–5 in the Bay Area. |

**Source:** `public/site.webmanifest`

---

## Images & assets

### Logos (production)

| Asset | Path | Used on |
|-------|------|---------|
| Wordmark (primary) | `/about-experiment/puddles-wordmark.png` (+ `@2x`) | Home, Browse, About, Share headers |
| Header logo (legacy) | `/puddles-logo-header.png` | Alternate layouts |
| P mark | `/brand/puddles-p-mark.png` (+ `@2x`) | Brand experiments |

**Source:** `src/pages/experimentShared.ts`

### Favicon & PWA

| Asset | Path |
|-------|------|
| Favicon | `/favicon.png`, `/favicon-16.png`, `/favicon.svg` |
| Apple touch | `/apple-touch-icon.png` |
| PWA | `/icon-192.png`, `/icon-512.png` |

### Social & marketing

| Asset | Path | Notes |
|-------|------|-------|
| OG share image | `/og-image.png` | Link previews (Facebook, iMessage, Slack, etc.) |
| Discovery hero | `/discovery-hero.png` | Legacy `/discovery` route |

### About page art

| Asset | Path |
|-------|------|
| Hero | `/about/hero.png` (+ `@2x`) |
| Decorative | `/about/book.png`, `/about/feet.png`, `/about/tree.png` (+ `@2x`) |
| Logo + tagline | `/about/puddles-logo-tagline.png` (+ `@2x`) |

### Home map & UI

| Asset | Path |
|-------|------|
| Map pin | `/home-experiment/spotlight-marker.png` |
| Droplet | `/home-experiment/puddles-droplet.png` |

**Source:** `src/pages/experimentShared.ts`, `src/pages/homeMapPreview.ts`

### UI & empty states

| Asset | Path | Used for |
|-------|------|----------|
| Empty state | `/empty-state-pin.png` | No results |
| 404 | `/not-found-pin.png` | Page not found |
| Maintenance | `/maintenance-pin.png` | Maintenance mode |
| Activity fallbacks | `/event-fallbacks/{stories,music,play,outdoor,arts,build,classes,other}.png` | Missing activity images |

### Not production

`/logo-explorations/*` — design exploration only; do not use on live pages.

---

## Code map (where to edit)

```
Global SEO            → src/config/site.ts
                        → index.html
                        → src/utils/siteMeta.ts

Home copy             → src/pages/homeExperimentAccentShared.ts
                        → src/pages/HomeExperimentPage.tsx (refined headline)

About copy            → src/pages/aboutShared.ts

City SEO + intro      → src/config/localRoutes.ts

Activity SEO          → src/utils/eventPages.ts

Browse/Home counters  → src/utils/browseResultsCopy.ts

Logos & image paths   → src/pages/experimentShared.ts

Brand lockup          → src/components/layout/BrandLockup.tsx

Robots / sitemap      → public/robots.txt, public/sitemap.xml
PWA manifest          → public/site.webmanifest
```

---

## Experiment & legacy copy (not production `/`)

These routes exist for design experiments. Do not treat as live brand unless promoted.

| Item | Value | Source |
|------|-------|--------|
| Alternate home headline | Find storytimes, music, drop-ins, and local moments for ages 0–5. | `HOME_PAGE_HEADLINE` |
| Experiment supporting line | Storytimes, parks, music, drop-ins, and small local moments for ages 0–5. | `homeExperimentAccentShared.ts` |
| Discovery headline | Free & budget-friendly toddler activities nearby | `DiscoveryPage.tsx` |
| Legacy home CTA | Know something we should add? | `HomeExperimentPage.tsx` (non-refined) |

---

## Known inconsistencies (optional cleanup)

| Location | Current | Could align to |
|----------|---------|----------------|
| SEO descriptions (`site.ts`, `index.html`, manifest) | “library events” | “activities” voice throughout |
| City meta descriptions | “library events” | same |
| Refined headline | Inline in `HomeExperimentPage.tsx` | Extract to `homeExperimentAccentShared.ts` next to subtitle |
| `HOME_PAGE_HEADLINE` | Same text, no accent span | Used only on experiment home variants |

---

## Quick copy-paste sheet

**Headline:** Find storytimes, music, drop-ins, and local moments for ages 0–5.

**Subtitle:** Bay Area activities, from free library events to low-cost community programs.

**About tagline:** It takes a village — here's where to find it.

**CTA:** Know a small local moment?

**SEO title:** Puddles | Bay Area Activities for Ages 0–5

**SEO description (short):** Bay Area activities for ages 0–5 — storytimes, music, drop-ins, library programs, and free or low-cost local outings in Palo Alto, Los Altos, Mountain View, and Sunnyvale.

**OG image URL:** https://puddlesmap.com/og-image.png
