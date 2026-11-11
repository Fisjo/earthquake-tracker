import type { EarthquakesResponse, SortKey, Stats, Window } from './types'

export class ApiError extends Error {}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new ApiError(`HTTP ${response.status} en ${url}`)
  return response.json() as Promise<T>
}

export function fetchEarthquakes(
  window: Window,
  sort: SortKey,
  signal?: AbortSignal,
): Promise<EarthquakesResponse> {
  return getJson(`/api/earthquakes?window=${window}&sort=${sort}`, signal)
}

export function fetchStats(signal?: AbortSignal): Promise<Stats> {
  return getJson('/api/stats', signal)
}
