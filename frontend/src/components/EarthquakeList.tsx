import type { EarthquakesResponse } from '../api/types'
import type { AsyncState } from '../hooks/useAsync'
import EarthquakeCard from './EarthquakeCard'
import { EmptyMessage, ErrorMessage, LoadingMessage, WarningBanner } from './StatusMessage'

interface Props {
  state: AsyncState<EarthquakesResponse>
  onRetry: () => void
  now: Date
}

export default function EarthquakeList({ state, onRetry, now }: Props) {
  if (state.status === 'loading') return <LoadingMessage>Cargando sismos…</LoadingMessage>
  if (state.status === 'error') {
    return <ErrorMessage onRetry={onRetry}>No se pudieron cargar los sismos.</ErrorMessage>
  }
  const { earthquakes, stale, warning } = state.data
  return (
    <>
      {stale && warning && <WarningBanner>{warning}</WarningBanner>}
      {earthquakes.length === 0 ? (
        <EmptyMessage>No hay sismos en este periodo.</EmptyMessage>
      ) : (
        <ul className="flex flex-col gap-2">
          {earthquakes.map((earthquake) => (
            <EarthquakeCard key={earthquake.usgs_id} earthquake={earthquake} now={now} />
          ))}
        </ul>
      )}
    </>
  )
}
