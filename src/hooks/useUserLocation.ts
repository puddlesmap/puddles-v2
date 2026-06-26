import { useCallback, useState } from 'react'

export interface UserLocationCoords {
  lat: number
  lng: number
}

export function useUserLocation() {
  const [coords, setCoords] = useState<UserLocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Location access unavailable')
      setCoords(null)
      return Promise.resolve(null)
    }

    setIsRequesting(true)
    setError(null)

    return new Promise<UserLocationCoords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setCoords(nextCoords)
          setError(null)
          setIsRequesting(false)
          resolve(nextCoords)
        },
        () => {
          setCoords(null)
          setError('Location access unavailable')
          setIsRequesting(false)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      )
    })
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    coords,
    error,
    isRequesting,
    requestLocation,
    clearError,
  }
}
