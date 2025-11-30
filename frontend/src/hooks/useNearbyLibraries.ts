import { useCallback, useState } from 'react'

import { useLocation } from '../contexts/LocationContext'
import { fetchNearbyLibraries, type NearbyLibrarySummary } from '../services/locationService'

interface UseNearbyLibrariesState {
  libraries: NearbyLibrarySummary[]
  isLoading: boolean
  error: string | null
  loadNearbyLibraries: () => Promise<void>
  reset: () => void
}

export function useNearbyLibraries(): UseNearbyLibrariesState {
  const { userLocation, requestLocation } = useLocation()
  const [libraries, setLibraries] = useState<NearbyLibrarySummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNearbyLibraries = useCallback(async () => {
    if (!userLocation) {
      setError('User location not available yet. Attempting to request permission...')
      requestLocation()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const results = await fetchNearbyLibraries(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
      )

      setLibraries(results)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch nearby libraries'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [requestLocation, userLocation])

  const reset = useCallback(() => {
    setLibraries([])
    setError(null)
  }, [])

  return {
    libraries,
    isLoading,
    error,
    loadNearbyLibraries,
    reset,
  }
}
