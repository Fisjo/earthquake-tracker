import type { Earthquake } from './api/types'
import { DEPTH_CLASSES, depthClassIndex } from './map/markerStyle'

export interface Filters {
  /** 0 = sin filtro. */
  minMagnitude: number
  /** Una casilla por clase de `DEPTH_CLASSES`. */
  depthClasses: boolean[]
  text: string
}

export const DEFAULT_FILTERS: Filters = {
  minMagnitude: 0,
  depthClasses: DEPTH_CLASSES.map(() => true),
  text: '',
}

export function isDefaultFilters(filters: Filters): boolean {
  return (
    filters.minMagnitude === 0 &&
    filters.depthClasses.every(Boolean) &&
    filters.text.trim() === ''
  )
}

/** Cuántos tipos de filtro hay activos (magnitud, profundidad, texto). */
export function activeFilterCount(filters: Filters): number {
  return (
    Number(filters.minMagnitude > 0) +
    Number(!filters.depthClasses.every(Boolean)) +
    Number(filters.text.trim() !== '')
  )
}

/** Minúsculas y sin acentos, para comparar textos. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function matchesDepth(earthquake: Earthquake, depthClasses: boolean[]): boolean {
  const index = depthClassIndex(earthquake.depth)
  // Sin profundidad no pertenece a ninguna clase: solo se muestra si no se ha excluido ninguna.
  return index === null ? depthClasses.every(Boolean) : depthClasses[index]
}

export function applyFilters(earthquakes: Earthquake[], filters: Filters): Earthquake[] {
  const query = normalize(filters.text.trim())
  return earthquakes.filter((earthquake) => {
    if (filters.minMagnitude > 0) {
      if (earthquake.magnitude === null || earthquake.magnitude < filters.minMagnitude) return false
    }
    if (!matchesDepth(earthquake, filters.depthClasses)) return false
    if (query && !normalize(earthquake.place ?? earthquake.title).includes(query)) return false
    return true
  })
}
