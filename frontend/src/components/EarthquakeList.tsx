import type { EarthquakesResponse } from '../api/types'
import type { AsyncState } from '../hooks/useAsync'
import EarthquakeCard from './EarthquakeCard'
import { EmptyMessage, ErrorMessage, LoadingMessage, WarningBanner } from './StatusMessage'

interface Props {
  state: AsyncState<EarthquakesResponse>
  onRetry: () => void
  now: Date
  selectedId: string | null
  onSelect: (id: string) => void
  hoveredId: string | null
  onHover: (id: string | null) => void
  /** La lista está vacía porque los filtros excluyen todo, no porque no haya sismos. */
  emptyDueToFilters?: boolean
  onClearFilters?: () => void
}

export default function EarthquakeList({
  state,
  onRetry,
  now,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
  emptyDueToFilters = false,
  onClearFilters,
}: Props) {
  if (state.status === 'loading') return <LoadingMessage>Cargando sismos…</LoadingMessage>
  if (state.status === 'error') {
    return <ErrorMessage onRetry={onRetry}>No se pudieron cargar los sismos.</ErrorMessage>
  }
  const { earthquakes, stale, warning } = state.data
  return (
    <>
      {stale && warning && <WarningBanner>{warning}</WarningBanner>}
      {earthquakes.length === 0 ? (
        emptyDueToFilters ? (
          <div className="py-8 text-center">
            <EmptyMessage>Ningún sismo coincide con los filtros.</EmptyMessage>
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-11 rounded-sm px-3 text-sm font-medium text-accent underline hover:text-ink"
            >
              Quitar filtros
            </button>
          </div>
        ) : (
          <EmptyMessage>No hay sismos en este periodo.</EmptyMessage>
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {earthquakes.map((earthquake) => (
            <EarthquakeCard
              key={earthquake.usgs_id}
              earthquake={earthquake}
              now={now}
              selected={earthquake.usgs_id === selectedId}
              onSelect={onSelect}
              highlighted={earthquake.usgs_id === hoveredId}
              onHover={onHover}
            />
          ))}
        </ul>
      )}
    </>
  )
}
