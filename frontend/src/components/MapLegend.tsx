import { DEPTH_CLASSES, magnitudeRadius } from '../map/markerStyle'

const SAMPLE_MAGNITUDES = [2, 4, 6, 8]

/** Franja bajo el mapa en móvil; en escritorio flota sobre él, en su esquina inferior izquierda. */
export default function MapLegend() {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-line bg-card p-3 text-xs lg:absolute lg:bottom-3 lg:left-3 lg:z-[1000] lg:block lg:rounded-md lg:border lg:shadow-sm">
      <div>
        <p className="font-semibold">Profundidad</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-x-0">
          {DEPTH_CLASSES.map((depthClass) => (
            <div key={depthClass.label} className="flex items-center gap-2">
              <span
                data-swatch
                className="size-3 rounded-full"
                style={{ backgroundColor: depthClass.color }}
              />
              <span className="tabular-nums">{depthClass.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:mt-3">
        <p className="font-semibold">Magnitud</p>
        <div className="mt-1 flex items-end gap-3">
          {SAMPLE_MAGNITUDES.map((magnitude) => (
            <div key={magnitude} className="flex flex-col items-center gap-1">
              <span
                className="rounded-full border border-ink/40 bg-ink/10"
                style={{
                  width: magnitudeRadius(magnitude) * 2,
                  height: magnitudeRadius(magnitude) * 2,
                }}
              />
              <span className="tabular-nums">{`M ${magnitude}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
