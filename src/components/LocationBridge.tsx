import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { trackCitySelected } from '../utils/analytics'

const CITIES = ['Palo Alto', 'Los Altos', 'Mountain View'] as const

export function LocationBridge() {
  const navigate = useNavigate()
  const {
    showLocationBridge,
    setShowLocationBridge,
    setCity,
    setBrowseFilters,
    browseFilters,
    locationBridgeSource,
  } = useApp()

  if (!showLocationBridge) return null

  function select(city: string, locked = false) {
    trackCitySelected(city, 'browse')
    setCity(city)
    setBrowseFilters({
      ...browseFilters,
      city,
      cityLocked: locked,
    })
    setShowLocationBridge(false)
    if (locationBridgeSource === 'discovery') {
      navigate('/browse')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h2 className="font-display text-[22px] text-charcoal">Where?</h2>
        <button
          type="button"
          onClick={() => setShowLocationBridge(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-charcoal hover:bg-surface-muted"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 px-6">
        {[
          { label: 'Nearby', icon: '📍', action: () => { window.alert('Location permission requested'); select('all') } },
          { label: 'All cities', icon: '🗺️', action: () => select('all') },
          ...CITIES.map((city) => ({ label: city, icon: null, action: () => select(city, true) })),
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="w-full border-b border-border py-5 text-left text-[17px] font-medium text-charcoal hover:bg-surface-muted"
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
