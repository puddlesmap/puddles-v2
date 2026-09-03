# Google Maps setup

**Prefer Google Maps for production.** Puddles already switches to Google when a Maps API key is set (`BrowseMapView`). Without it, browse falls back to Leaflet (OSM tiles, or CARTO if you add a CARTO key).

CARTO without a key now shows **“API key required”** — that is why you were seeing the watermark. Google avoids that and is the intended path.

## Cost (2026)

Google no longer gives a flat $200 credit. Each SKU has a **monthly free allowance**:

| SKU (what Puddles uses) | Free / month | After free |
|-------------------------|--------------|------------|
| **Dynamic Maps** (browse map) | **10,000** map loads | ~$7 / 1,000 |
| **Static Maps** (previews) | **10,000** loads | ~$2 / 1,000 |

For early Puddles traffic this usually stays **$0**. Still enable billing (Google requires it) and set budget alerts.

## Enable APIs

In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis):

1. Create or select a project and enable billing
2. Enable **Maps JavaScript API** (browse map)
3. Enable **Static Maps API** (event modal + discovery preview)
4. Create an API key and restrict it by HTTP referrer (`localhost:*`, `puddlesmap.com/*`, Netlify preview hosts)

## Env

Local (`.env.local`):

```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

Netlify / Next also accept:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

Restart the dev server after changing env. Redeploy after setting Netlify env.

## Cost safeguards

- Billing budget alerts ($10, $25)
- Daily quotas on Dynamic Maps and Static Maps
- Browse map only loads when the user switches to map view

## Leaflet fallback (no Google key)

1. **OSM tiles** — default when neither Google nor CARTO is set (no key watermark)
2. **CARTO Voyager** — optional; set `NEXT_PUBLIC_CARTO_BASEMAP_API_KEY` if you want CARTO styling without Google
