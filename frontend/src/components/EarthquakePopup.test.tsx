import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { earthquake } from '../test-utils'
import EarthquakePopup from './EarthquakePopup'

test('muestra lugar, magnitud, profundidad y fecha en UTC', () => {
  render(<EarthquakePopup earthquake={earthquake({ occurred_at: '2026-01-01T11:55:00Z' })} />)
  expect(screen.getByText('10 km N of Ficticia')).toBeInTheDocument()
  expect(screen.getByText('M 4.5')).toBeInTheDocument()
  expect(screen.getByText('10 km')).toBeInTheDocument()
  expect(screen.getByText(/2026.*11:55 UTC/)).toBeInTheDocument()
})

test('enlaza a la ficha del evento en USGS de forma segura', () => {
  render(<EarthquakePopup earthquake={earthquake({ usgs_id: 'us7000abc' })} />)
  const enlace = screen.getByRole('link', { name: 'Ver en USGS' })
  expect(enlace).toHaveAttribute('href', 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abc')
  expect(enlace).toHaveAttribute('target', '_blank')
  expect(enlace).toHaveAttribute('rel', expect.stringContaining('noopener'))
})

test('sin lugar usa el título y sin magnitud ni profundidad no se rompe', () => {
  render(
    <EarthquakePopup earthquake={earthquake({ place: null, title: 'Título', magnitude: null, depth: null })} />,
  )
  expect(screen.getByText('Título')).toBeInTheDocument()
  expect(screen.getByText('M —')).toBeInTheDocument()
  expect(screen.getByText('Profundidad desconocida')).toBeInTheDocument()
})
