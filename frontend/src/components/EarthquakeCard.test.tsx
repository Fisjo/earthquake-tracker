import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { earthquake } from '../test-utils'
import EarthquakeCard from './EarthquakeCard'

const now = new Date('2026-01-01T12:00:00Z')

test('muestra magnitud, lugar, profundidad y hora relativa', () => {
  render(<EarthquakeCard earthquake={earthquake()} now={now} />)
  expect(screen.getByText('M 4.5')).toBeInTheDocument()
  expect(screen.getByText('10 km N of Ficticia')).toBeInTheDocument()
  expect(screen.getByText('10 km')).toBeInTheDocument()
  expect(screen.getByText('hace 5 min')).toBeInTheDocument()
})

test('sin lugar usa el título', () => {
  render(<EarthquakeCard earthquake={earthquake({ place: null, title: 'Título' })} now={now} />)
  expect(screen.getByText('Título')).toBeInTheDocument()
})

test('magnitud y profundidad nulas', () => {
  render(<EarthquakeCard earthquake={earthquake({ magnitude: null, depth: null })} now={now} />)
  expect(screen.getByText('M —')).toBeInTheDocument()
  expect(screen.getByText('Profundidad desconocida')).toBeInTheDocument()
})

test('marca de tsunami solo cuando corresponde', () => {
  const { rerender } = render(<EarthquakeCard earthquake={earthquake()} now={now} />)
  expect(screen.queryByText('Marca de tsunami')).not.toBeInTheDocument()
  rerender(<EarthquakeCard earthquake={earthquake({ tsunami: true })} now={now} />)
  expect(screen.getByText('Marca de tsunami')).toBeInTheDocument()
})
