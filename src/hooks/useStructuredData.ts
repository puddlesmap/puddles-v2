import { useEffect } from 'react'

export function useStructuredData(
  id: string,
  payload: Record<string, unknown> | null,
): void {
  useEffect(() => {
    if (!payload) return

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    script.textContent = JSON.stringify(payload)

    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [id, payload])
}
