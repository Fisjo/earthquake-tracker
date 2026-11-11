import type { Stats } from '../api/types'
import { formatMagnitude } from '../format'
import type { AsyncState } from '../hooks/useAsync'
import { LoadingMessage } from './StatusMessage'

interface TileProps {
  label: string
  value: string
  detail?: string
  figure?: boolean
  wide?: boolean
}

function Tile({ label, value, detail, figure = false, wide = false }: TileProps) {
  return (
    <div className={`rounded-md border border-line bg-card p-4 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {figure ? (
        <p data-figure className="mt-2 font-mono text-3xl font-medium tabular-nums">
          {value}
        </p>
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      )}
      {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
    </div>
  )
}

export default function StatsBar({ state }: { state: AsyncState<Stats> }) {
  if (state.status === 'loading') return <LoadingMessage>Cargando estadísticas…</LoadingMessage>
  if (state.status === 'error') {
    return <p className="py-4 text-center text-muted">Estadísticas no disponibles</p>
  }
  const { total_24h, max_magnitude, most_active_region } = state.data
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Tile label="Sismos en 24 h" value={String(total_24h)} figure />
      <Tile
        label="Magnitud máxima"
        value={max_magnitude === null ? '—' : formatMagnitude(max_magnitude)}
        figure
      />
      <Tile
        label="Zona más activa"
        wide
        value={most_active_region?.name ?? '—'}
        detail={
          most_active_region
            ? `${most_active_region.count} ${most_active_region.count === 1 ? 'sismo' : 'sismos'}`
            : undefined
        }
      />
    </div>
  )
}
