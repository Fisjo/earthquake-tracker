import type { SortKey, Window } from './api/types'

export const WINDOW_OPTIONS: { value: Window; label: string }[] = [
  { value: 'hour', label: 'Última hora' },
  { value: 'day', label: 'Últimas 24 h' },
  { value: 'week', label: 'Últimos 7 días' },
]

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'magnitude', label: 'Mayor magnitud' },
  { value: 'depth', label: 'Mayor profundidad' },
  { value: 'significance', label: 'Más significativos' },
]
