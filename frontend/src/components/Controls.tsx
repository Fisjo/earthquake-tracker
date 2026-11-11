import type { SortKey, Window } from '../api/types'
import { SORT_OPTIONS, WINDOW_OPTIONS } from '../labels'

interface Props {
  window: Window
  sort: SortKey
  onWindowChange: (window: Window) => void
  onSortChange: (sort: SortKey) => void
}

export default function Controls({ window, sort, onWindowChange, onSortChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
      <div className="flex gap-1 rounded-md bg-surface p-1">
        {WINDOW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={window === option.value}
            onClick={() => onWindowChange(option.value)}
            className="min-h-11 flex-1 whitespace-nowrap rounded-sm px-2 text-sm font-medium text-muted transition-colors hover:text-ink active:translate-y-px active:scale-[.985] aria-pressed:bg-accent aria-pressed:text-accent-ink sm:px-4"
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between gap-3 text-sm font-medium text-muted">
        Ordenar por
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className="min-h-11 rounded-sm border border-line bg-card px-3 text-ink"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
