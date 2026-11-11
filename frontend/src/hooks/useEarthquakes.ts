import { useCallback } from 'react'
import { fetchEarthquakes } from '../api/client'
import type { SortKey, Window } from '../api/types'
import { useAsync } from './useAsync'

export function useEarthquakes(window: Window, sort: SortKey) {
  const load = useCallback(
    (signal: AbortSignal) => fetchEarthquakes(window, sort, signal),
    [window, sort],
  )
  return useAsync(load)
}
