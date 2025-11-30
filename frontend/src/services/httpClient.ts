const DEFAULT_TIMEOUT = 10000

export interface HttpClientOptions extends RequestInit {
  timeoutMs?: number
}

export async function httpClient<T>(path: string, options: HttpClientOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT)

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/${path.replace(/^\//, '')}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return (await response.json()) as T
  } catch (error) {
    console.warn('httpClient stub error:', error)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
