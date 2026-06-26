import { APIProvider } from '@vis.gl/react-google-maps'
import type { ReactNode } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../utils/googleMaps'

interface GoogleMapProviderProps {
  children: ReactNode
}

export function GoogleMapProvider({ children }: GoogleMapProviderProps) {
  return <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>{children}</APIProvider>
}
