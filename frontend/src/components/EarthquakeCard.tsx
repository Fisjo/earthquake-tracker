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
    <li className="flex items-center gap-4 rounded-lg bg-slate-800 p-4">
      <span className="w-20 shrink-0 text-center text-xl font-bold text-sky-300">
        {formatMagnitude(earthquake.magnitude)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{earthquake.place ?? earthquake.title}</p>
        <p className="flex flex-wrap gap-x-3 text-sm text-slate-400">
          <span>{formatDepth(earthquake.depth)}</span>
          <span>{formatRelativeTime(earthquake.occurred_at, now)}</span>
          {earthquake.tsunami && <span className="text-amber-300">Marca de tsunami</span>}
        </p>
      </div>
    </li>
  )
}
