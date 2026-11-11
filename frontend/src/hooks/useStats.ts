import { fetchStats } from '../api/client'
import { useAsync } from './useAsync'

const loadStats = (signal: AbortSignal) => fetchStats(signal)

export function useStats() {
  return useAsync(loadStats)
}
