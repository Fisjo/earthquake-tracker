export type Window = 'hour' | 'day' | 'week'
export type SortKey = 'recent' | 'magnitude' | 'depth' | 'significance'

export interface Earthquake {
  usgs_id: string
  title: string
  place: string | null
  magnitude: number | null
  depth: number | null
  latitude: number
  longitude: number
  occurred_at: string
  alert_level: string | null
  tsunami: boolean
  significance: number | null
}

export interface EarthquakesResponse {
  earthquakes: Earthquake[]
  stale: boolean
  warning: string | null
}

export interface Stats {
  total_24h: number
  max_magnitude: number | null
  most_active_region: { name: string; count: number } | null
  stale: boolean
  warning: string | null
}
