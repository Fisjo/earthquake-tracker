import { useId, useState } from 'react'
import { type Filters, activeFilterCount, isDefaultFilters } from '../filters'
import { formatMagnitude } from '../format'
import { DEPTH_CLASSES } from '../map/markerStyle'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  /** null mientras se cargan los sismos. */
  counts: { total: number; shown: number } | null
  onReset: () => void
}

function magnitudeText(minMagnitude: number): string {
  return minMagnitude === 0 ? 'Todas' : `${formatMagnitude(minMagnitude)} o más`
}

export default function FilterPanel({ filters, onChange, counts, onReset }: Props) {
  const magnitudeId = useId()
  // Abierto por defecto en escritorio; en móvil se pliega para que el mapa se vea en la primera pantalla.
  const [open, setOpen] = useState(() => window.matchMedia?.('(min-width: 1024px)').matches ?? false)
  const active = activeFilterCount(filters)
  const toggleDepth = (index: number) =>
    onChange({
      ...filters,
      depthClasses: filters.depthClasses.map((on, i) => (i === index ? !on : on)),
    })

  return (
    <section aria-label="Filtros" className="rounded-md border border-line bg-card">
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group"
      >
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 text-sm font-semibold">
          <span>
            Filtros
            {active > 0 && <span className="ml-1 font-normal text-accent">{`(${active})`}</span>}
          </span>
          <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-sm font-medium text-muted">
                <label htmlFor={magnitudeId}>Magnitud mínima</label>
                <span aria-hidden="true" className="font-mono text-ink tabular-nums">
                  {magnitudeText(filters.minMagnitude)}
                </span>
              </div>
              <input
                id={magnitudeId}
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={filters.minMagnitude}
                aria-valuetext={magnitudeText(filters.minMagnitude)}
                onChange={(event) =>
                  onChange({ ...filters, minMagnitude: Number(event.target.value) })
                }
                className="min-h-11 w-full accent-accent"
              />
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-muted">
              Buscar lugar
              <input
                type="search"
                value={filters.text}
                placeholder="Alaska, Chile…"
                onChange={(event) => onChange({ ...filters, text: event.target.value })}
                className="min-h-11 rounded-sm border border-line bg-bg px-3 font-normal text-ink"
              />
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-muted">Profundidad</legend>
            <div className="flex flex-wrap gap-2">
              {DEPTH_CLASSES.map((depthClass, index) => (
                <label
                  key={depthClass.label}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-line bg-bg px-3 text-sm tabular-nums"
                >
                  <input
                    type="checkbox"
                    checked={filters.depthClasses[index]}
                    onChange={() => toggleDepth(index)}
                    className="size-4 accent-accent"
                  />
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full"
                    style={{ backgroundColor: depthClass.color }}
                  />
                  {depthClass.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-1">
        {counts ? (
          <p role="status" className="text-sm text-muted tabular-nums">
            {`Mostrando ${counts.shown} de ${counts.total} ${counts.total === 1 ? 'sismo' : 'sismos'}`}
          </p>
        ) : (
          <span />
        )}
        {!isDefaultFilters(filters) && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 rounded-sm px-3 text-sm font-medium text-accent underline transition-colors hover:text-ink"
          >
            Quitar filtros
          </button>
        )}
      </div>
    </section>
  )
}
