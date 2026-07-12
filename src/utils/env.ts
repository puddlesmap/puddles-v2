type PublicEnvName = 'ANCHOR_DATE' | 'GOOGLE_MAPS_API_KEY' | 'PUDDLES_API_KEY'

export function getPublicEnv(name: PublicEnvName): string {
  const viteKey = `VITE_${name}`
  const nextKey = `NEXT_PUBLIC_${name}`

  if (typeof process !== 'undefined') {
    const fromProcess = process.env[nextKey] ?? process.env[viteKey]
    if (typeof fromProcess === 'string' && fromProcess.trim()) {
      return fromProcess.trim()
    }
  }

  return ''
}
