export interface DepthClass {
  label: string
  /** Profundidad mínima (km, inclusive) de la clase. */
  min: number
  color: string
}

// De superficial (cálido) a profundo (frío). Sin violeta, legibles sobre las teselas claras.
export const DEPTH_CLASSES: DepthClass[] = [
  { label: '< 30 km', min: -Infinity, color: '#d9480f' },
  { label: '30–70 km', min: 30, color: '#f59f00' },
  { label: '70–300 km', min: 70, color: '#0c8599' },
  { label: '≥ 300 km', min: 300, color: '#1864ab' },
]

export const NO_DATA_COLOR = '#868e96'

const MIN_RADIUS = 4
const RADIUS_PER_MAGNITUDE = 2.2
const MAX_MAGNITUDE = 9

export function depthColor(depth: number | null): string {
  if (depth === null) return NO_DATA_COLOR
  const match = [...DEPTH_CLASSES].reverse().find((c) => depth >= c.min)
  return match ? match.color : NO_DATA_COLOR
}

/** Radio del marcador en píxeles: 4 px en M 0 y ~24 px en M 9. */
export function magnitudeRadius(magnitude: number | null): number {
  if (magnitude === null) return MIN_RADIUS
  const clamped = Math.min(Math.max(magnitude, 0), MAX_MAGNITUDE)
  return MIN_RADIUS + RADIUS_PER_MAGNITUDE * clamped
}
