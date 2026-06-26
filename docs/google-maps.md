# Google Maps setup

Puddles uses Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is set. Without it, maps fall back to Leaflet + Carto tiles.

## Enable APIs

In [Google Cloud Console](https://console.cloud.google.com/google/maps-apis):

1. Create or select a project and enable billing
2. Enable **Maps JavaScript API** (browse map)
3. Enable **Static Maps API** (event modal + discovery preview)
4. Create an API key and restrict it by HTTP referrer (`localhost:*`, your production domain)

## Env

```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

Add to `.env.local` for dev and Netlify env for production.

## Cost safeguards

- Set billing budget alerts ($10, $25)
- Set daily quotas on Dynamic Maps and Static Maps
- Browse map only loads when the user switches to map view

## Free tier (2026)

- **Dynamic Maps:** 10,000 loads/month free, then ~$7 per 1,000
- **Static Maps:** 10,000 loads/month free, then ~$2 per 1,000

Early Puddles traffic should stay within free caps.
