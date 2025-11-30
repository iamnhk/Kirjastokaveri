import { createContext, useContext, useMemo, type ReactNode } from 'react'

interface LocationContextValue {
  userLocation: GeolocationPosition | null
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined)

interface LocationProviderProps {
  children: ReactNode
}

export function LocationProvider({ children }: LocationProviderProps) {
  const value = useMemo<LocationContextValue>(() => ({ userLocation: null }), [])

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
