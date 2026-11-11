import type { CircleMarker as LeafletCircleMarker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Earthquake } from '../api/types'
import { depthColor, magnitudeRadius } from '../map/markerStyle'
import EarthquakePopup from './EarthquakePopup'
import MapLegend from './MapLegend'

interface Props {
  earthquakes: Earthquake[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

// Encuadre inicial: el mundo entero (sin la Antártida) quepa en el panel, sea del tamaño que sea.
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-58, -180],
  [80, 180],
]
const SELECTED_MIN_ZOOM = 5

type MarkerRegistry = React.RefObject<Map<string, LeafletCircleMarker>>

/** Lleva el mapa al sismo seleccionado y abre su popup; sin selección, lo cierra. */
function SelectionController({
  selectedId,
  markers,
  earthquakes,
}: {
  selectedId: string | null
  markers: MarkerRegistry
  earthquakes: Earthquake[]
}) {
  const map = useMap()

  useEffect(() => {
    const marker = selectedId ? markers.current.get(selectedId) : undefined
    if (!marker) return
    const zoom = Math.max(map.getZoom(), SELECTED_MIN_ZOOM)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) map.setView(marker.getLatLng(), zoom, { animate: false })
    else map.flyTo(marker.getLatLng(), zoom, { duration: 0.8 })
    marker.bringToFront()
    marker.openPopup()
  }, [map, selectedId, markers, earthquakes])

  return null
}

export default function EarthquakeMap({ earthquakes, selectedId, onSelect }: Props) {
  const markers = useRef(new Map<string, LeafletCircleMarker>())
  const selectedRef = useRef(selectedId)

  // En un layout effect para que esté al día antes de los efectos de los hijos: al abrir el popup
  // de otro sismo Leaflet cierra el anterior y `popupclose` no debe borrar la nueva selección.
  useLayoutEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  // Los grandes debajo y los pequeños encima, para que todos se puedan pulsar.
  const ordered = useMemo(
    () =>
      [...earthquakes].sort((a, b) => magnitudeRadius(b.magnitude) - magnitudeRadius(a.magnitude)),
    [earthquakes],
  )

  return (
    <section
      aria-label="Mapa de sismos"
      className="relative overflow-hidden rounded-md border border-line lg:h-full"
    >
      <MapContainer
        bounds={WORLD_BOUNDS}
        minZoom={1}
        zoomSnap={0.25}
        worldCopyJump
        className="h-[45vh] min-h-72 w-full lg:h-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {ordered.map((earthquake) => {
          const selected = earthquake.usgs_id === selectedId
          return (
            <CircleMarker
              key={earthquake.usgs_id}
              ref={(marker) => {
                if (marker) markers.current.set(earthquake.usgs_id, marker)
                else markers.current.delete(earthquake.usgs_id)
              }}
              center={[earthquake.latitude, earthquake.longitude]}
              radius={magnitudeRadius(earthquake.magnitude)}
              pathOptions={{
                color: selected ? '#0a0a0a' : '#ffffff',
                weight: selected ? 3 : 1,
                fillColor: depthColor(earthquake.depth),
                fillOpacity: selected ? 0.9 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelect(earthquake.usgs_id),
                popupclose: () => {
                  if (selectedRef.current === earthquake.usgs_id) onSelect(null)
                },
              }}
            >
              <Popup autoPan={false}>
                <EarthquakePopup earthquake={earthquake} />
              </Popup>
            </CircleMarker>
          )
        })}
        <SelectionController selectedId={selectedId} markers={markers} earthquakes={earthquakes} />
      </MapContainer>
      <MapLegend />
    </section>
  )
}
