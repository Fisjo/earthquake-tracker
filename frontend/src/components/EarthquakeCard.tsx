import type { Earthquake } from '../api/types'
import { formatDepth, formatMagnitude, formatRelativeTime } from '../format'

export default function EarthquakeCard({
  earthquake,
  now,
}: {
  earthquake: Earthquake
  now: Date
}) {
  return (
    <li className="flex items-center gap-4 rounded-md border border-line bg-card p-4">
      <span
        data-figure
        className="w-20 shrink-0 rounded-sm bg-surface py-2 text-center font-mono text-lg font-medium tabular-nums text-accent"
      >
        {formatMagnitude(earthquake.magnitude)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-semibold">{earthquake.place ?? earthquake.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-muted">
          <span>{formatDepth(earthquake.depth)}</span>
          <span>{formatRelativeTime(earthquake.occurred_at, now)}</span>
          {earthquake.tsunami && (
            <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Marca de tsunami
            </span>
          )}
        </p>
      </div>
    </li>
  )
}
