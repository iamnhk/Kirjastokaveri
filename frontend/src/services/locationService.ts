export interface NearbyLibrarySummary {
  id: string
  name: string
  address?: string
  distanceKm?: number
}

export async function fetchNearbyLibraries(latitude: number, longitude: number): Promise<NearbyLibrarySummary[]> {
  console.warn('Location service stub: replace with backend call when ready', { latitude, longitude })
  return []
}
