type PublicEnvName =
  | 'ANCHOR_DATE'
  | 'GOOGLE_MAPS_API_KEY'
  | 'CARTO_BASEMAP_API_KEY'
  | 'PUDDLES_API_KEY'

/**
 * Read a public env var for browser + server.
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` when the full key is a
 * static string — dynamic `process.env[name]` is empty in the client bundle.
 */
export function getPublicEnv(name: PublicEnvName): string {
  switch (name) {
    case 'GOOGLE_MAPS_API_KEY':
      return (
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
        process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
        ''
      )
    case 'CARTO_BASEMAP_API_KEY':
      return (
        process.env.NEXT_PUBLIC_CARTO_BASEMAP_API_KEY?.trim() ||
        process.env.VITE_CARTO_BASEMAP_API_KEY?.trim() ||
        ''
      )
    case 'PUDDLES_API_KEY':
      return (
        process.env.NEXT_PUBLIC_PUDDLES_API_KEY?.trim() ||
        process.env.VITE_PUDDLES_API_KEY?.trim() ||
        ''
      )
    case 'ANCHOR_DATE':
      return (
        process.env.NEXT_PUBLIC_ANCHOR_DATE?.trim() ||
        process.env.VITE_ANCHOR_DATE?.trim() ||
        ''
      )
    default:
      return ''
  }
}
