import type { CircleMarker as LeafletCircleMarker, PathOptions } from 'leaflet'
import { memo, useMemo } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import type { Earthquake } from '../api/types'
import { depthColor, magnitudeRadius } from '../map/markerStyle'
import EarthquakePopup from './EarthquakePopup'

interface Props {
  earthquake: Earthquake
  selected: boolean
  hovered: boolean
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onPopupClose: (id: string) => void
  register: (id: string, marker: LeafletCircleMarker | null) => void
}

function pathOptions(depth: number | null, selected: boolean, hovered: boolean): PathOptions {
  const emphasised = selected || hovered
  return {
    color: emphasised ? '#0a0a0a' : '#ffffff',
    weight: selected ? 3 : hovered ? 2 : 1,
    fillColor: depthColor(depth),
    fillOpacity: selected ? 0.9 : hovered ? 0.85 : 0.7,
  }
}

/** Memoizado: al resaltar o seleccionar un sismo solo se vuelven a dibujar los marcadores afectados. */
function EarthquakeMarker({
  earthquake,
  selected,
  hovered,
  onSelect,
  onHover,
  onPopupClose,
  register,
}: Props) {
  const id = earthquake.usgs_id
  const options = useMemo(
    () => pathOptions(earthquake.depth, selected, hovered),
    [earthquake.depth, selected, hovered],
  )
  const handlers = useMemo(
    () => ({
      click: () => onSelect(id),
      mouseover: () => onHover(id),
      mouseout: () => onHover(null),
      popupclose: () => onPopupClose(id),
    }),
    [id, onSelect, onHover, onPopupClose],
  )

  return (
    <CircleMarker
      ref={(marker) => register(id, marker)}
      center={[earthquake.latitude, earthquake.longitude]}
      radius={magnitudeRadius(earthquake.magnitude)}
      pathOptions={options}
      eventHandlers={handlers}
    >
      <Popup autoPan={false}>
        <EarthquakePopup earthquake={earthquake} />
      </Popup>
    </CircleMarker>
  )
}

export default memo(EarthquakeMarker)
