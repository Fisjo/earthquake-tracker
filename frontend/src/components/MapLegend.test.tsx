import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { DEPTH_CLASSES } from '../map/markerStyle'
import MapLegend from './MapLegend'

test('lista las cuatro clases de profundidad con su color', () => {
  render(<MapLegend />)
  for (const clase of DEPTH_CLASSES) {
    const etiqueta = screen.getByText(clase.label)
    expect(etiqueta.parentElement?.querySelector('[data-swatch]')).toHaveStyle({
      backgroundColor: clase.color,
    })
  }
})

test('explica el tamaño por magnitud', () => {
  render(<MapLegend />)
  expect(screen.getByText('Magnitud')).toBeInTheDocument()
  expect(screen.getByText('Profundidad')).toBeInTheDocument()
  for (const m of ['M 2', 'M 4', 'M 6', 'M 8']) {
    expect(screen.getByText(m)).toBeInTheDocument()
  }
})
