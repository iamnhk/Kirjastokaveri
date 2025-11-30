import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface LocationContextValue {
  userLocation: GeolocationPosition | null
  requestLocation: () => void
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

interface LocationProviderProps {
  children: ReactNode
  autoRequest?: boolean
}

export function LocationProvider({ children, autoRequest = false }: LocationProviderProps) {
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null)

  useEffect(() => {
    if (!autoRequest) {
      return
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation API not available in this environment')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => setUserLocation(position),
      (error) => console.warn('Geolocation stub error:', error.message),
      { enableHighAccuracy: false, timeout: 5000 },
    )
  }, [autoRequest])

  const value = useMemo<LocationContextValue>(() => ({
    userLocation,
    requestLocation: () => {
      if (!navigator.geolocation) {
        console.warn('Geolocation API not available in this environment')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation(position),
        (error) => console.warn('Geolocation stub error:', error.message),
      )
    },
  }), [userLocation])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocation() {
  const context = useContext(LocationContext)

  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }

  return context
}
