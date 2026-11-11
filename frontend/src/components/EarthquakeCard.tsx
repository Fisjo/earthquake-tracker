import { useEffect, useRef } from 'react'
import type { Earthquake } from '../api/types'
import { formatDepth, formatMagnitude, formatRelativeTime } from '../format'

interface Props {
  earthquake: Earthquake
  now: Date
  selected: boolean
  onSelect: (id: string) => void
}

export default function EarthquakeCard({ earthquake, now, selected, onSelect }: Props) {
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selected) button.current?.scrollIntoView?.({ block: 'nearest' })
  }, [selected])

  return (
    <li>
      <button
        ref={button}
        type="button"
        aria-current={selected ? 'true' : undefined}
        onClick={() => onSelect(earthquake.usgs_id)}
        className="flex min-h-11 w-full items-center gap-4 rounded-md border border-line bg-card p-4 text-left transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-accent active:translate-y-0 aria-[current=true]:border-accent aria-[current=true]:ring-2 aria-[current=true]:ring-accent"
      >
        <span
          data-figure
          className="w-20 shrink-0 rounded-sm bg-surface py-2 text-center font-mono text-lg font-medium tabular-nums text-accent"
        >
          {formatMagnitude(earthquake.magnitude)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block font-semibold">
            {earthquake.place ?? earthquake.title}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-muted">
            <span>{formatDepth(earthquake.depth)}</span>
            <span>{formatRelativeTime(earthquake.occurred_at, now)}</span>
            {earthquake.tsunami && (
              <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                Marca de tsunami
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}
