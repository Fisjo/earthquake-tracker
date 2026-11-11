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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
        {WINDOW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={window === option.value}
            onClick={() => onWindowChange(option.value)}
            className="flex-1 rounded-md px-3 py-1.5 text-sm text-slate-300 aria-pressed:bg-sky-600 aria-pressed:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        Ordenar por
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-white"
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
