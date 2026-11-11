import type { Stats } from '../api/types'
import { formatMagnitude } from '../format'
import type { AsyncState } from '../hooks/useAsync'
import { LoadingMessage } from './StatusMessage'

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {detail && <p className="text-sm text-slate-400">{detail}</p>}
    </div>
  )
}

export default function StatsBar({ state }: { state: AsyncState<Stats> }) {
  if (state.status === 'loading') return <LoadingMessage>Cargando estadísticas…</LoadingMessage>
  if (state.status === 'error') {
    return <p className="py-4 text-center text-slate-400">Estadísticas no disponibles</p>
  }
  const { total_24h, max_magnitude, most_active_region } = state.data
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Tile label="Sismos en 24 h" value={String(total_24h)} />
      <Tile
        label="Magnitud máxima"
        value={max_magnitude === null ? '—' : formatMagnitude(max_magnitude)}
      />
      <Tile
        label="Zona más activa"
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
