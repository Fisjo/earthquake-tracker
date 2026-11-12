import { type CircleMarker as LeafletCircleMarker, latLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import type { Earthquake } from '../api/types'
import { magnitudeRadius } from '../map/markerStyle'
import EarthquakeMarker from './EarthquakeMarker'
import MapLegend from './MapLegend'

interface Props {
  earthquakes: Earthquake[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  hoveredId: string | null
  onHover: (id: string | null) => void
  /** Cuando cambia, el mapa se reencuadra sobre los sismos mostrados. */
  fitKey: string
}

// Encuadre inicial: el mundo entero (sin la Antártida) quepa en el panel, sea del tamaño que sea.
const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-58, -180],
  [80, 180],
]
const SELECTED_MIN_ZOOM = 5
const FIT_MAX_ZOOM = 6

type MarkerRegistry = React.RefObject<Map<string, LeafletCircleMarker>>

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Lleva el mapa al sismo seleccionado y abre su popup. */
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
  // Último marcador atendido: filtrar o reordenar no debe volver a mover el mapa si el marcador es el mismo.
  const handled = useRef<LeafletCircleMarker | null>(null)

  useEffect(() => {
    const marker = selectedId ? markers.current.get(selectedId) : undefined
    if (!marker) {
      if (!selectedId) handled.current = null
      return
    }
    if (handled.current === marker) return
    handled.current = marker
    const zoom = Math.max(map.getZoom(), SELECTED_MIN_ZOOM)
    if (prefersReducedMotion()) map.setView(marker.getLatLng(), zoom, { animate: false })
    else map.flyTo(marker.getLatLng(), zoom, { duration: 0.8 })
    marker.bringToFront()
    marker.openPopup()
  }, [map, selectedId, markers, earthquakes])

  return null
}

/**
 * Encuadra los sismos mostrados cada vez que cambia `fitKey` (filtros o ventana), no al ordenar.
 * Sin animación: Leaflet ignora un `setView` pedido mientras otro zoom animado sigue en curso, y al
 * arrastrar el deslizador de magnitud llegan varios cambios seguidos (los intermedios se perderían).
 */
function FitController({ earthquakes, fitKey }: { earthquakes: Earthquake[]; fitKey: string }) {
  const map = useMap()
  const fitted = useRef<string | null>(null)

  useEffect(() => {
    // Si aún no hay sismos (cargando o filtro vacío) se espera a tenerlos para esta misma clave.
    if (fitted.current === fitKey || earthquakes.length === 0) return
    fitted.current = fitKey
    if (earthquakes.length === 1) {
      const [only] = earthquakes
      map.setView([only.latitude, only.longitude], SELECTED_MIN_ZOOM, { animate: false })
      return
    }
    const bounds = latLngBounds(earthquakes.map((e) => [e.latitude, e.longitude]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: FIT_MAX_ZOOM, animate: false })
  }, [map, fitKey, earthquakes])

  return null
}

export default function EarthquakeMap({
  earthquakes,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
  fitKey,
}: Props) {
  const markers = useRef(new Map<string, LeafletCircleMarker>())
  const selectedRef = useRef(selectedId)

  // En un layout effect para que esté al día antes de los efectos de los hijos: al abrir el popup
  // de otro sismo Leaflet cierra el anterior y `popupclose` no debe borrar la nueva selección.
  useLayoutEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  const register = useCallback((id: string, marker: LeafletCircleMarker | null) => {
    if (marker) markers.current.set(id, marker)
    else markers.current.delete(id)
  }, [])

  const onPopupClose = useCallback(
    (id: string) => {
      if (selectedRef.current === id) onSelect(null)
    },
    [onSelect],
  )

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
        {ordered.map((earthquake) => (
          <EarthquakeMarker
            key={earthquake.usgs_id}
            earthquake={earthquake}
            selected={earthquake.usgs_id === selectedId}
            hovered={earthquake.usgs_id === hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onPopupClose={onPopupClose}
            register={register}
          />
        ))}
        <SelectionController selectedId={selectedId} markers={markers} earthquakes={earthquakes} />
        <FitController earthquakes={earthquakes} fitKey={fitKey} />
      </MapContainer>
      <MapLegend />
    </section>
  )
}
