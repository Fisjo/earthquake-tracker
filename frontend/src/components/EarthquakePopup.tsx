import type { Earthquake } from '../api/types'
import { formatDateTime, formatDepth, formatMagnitude } from '../format'

export default function EarthquakePopup({ earthquake }: { earthquake: Earthquake }) {
  return (
    <div className="flex min-w-48 flex-col gap-1">
      <p className="font-semibold">{earthquake.place ?? earthquake.title}</p>
      <p className="font-mono text-lg font-medium text-accent">
        {formatMagnitude(earthquake.magnitude)}
      </p>
      <p className="text-muted">{formatDepth(earthquake.depth)}</p>
      <p className="text-muted">{formatDateTime(earthquake.occurred_at)}</p>
      <a
        href={`https://earthquake.usgs.gov/earthquakes/eventpage/${earthquake.usgs_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-accent underline"
      >
        Ver en USGS
      </a>
    </div>
  )
}
