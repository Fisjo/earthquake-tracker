import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { statsBody } from '../test-utils'
import StatsBar from './StatsBar'

test('muestra las tres estadísticas', () => {
  render(<StatsBar state={{ status: 'success', data: statsBody() }} />)
  expect(screen.getByText('Sismos en 24 h')).toBeInTheDocument()
  expect(screen.getByText('120')).toBeInTheDocument()
  expect(screen.getByText('Magnitud máxima')).toBeInTheDocument()
  expect(screen.getByText('M 6.2')).toBeInTheDocument()
  expect(screen.getByText('Zona más activa')).toBeInTheDocument()
  expect(screen.getByText('Chile')).toBeInTheDocument()
  expect(screen.getByText('14 sismos')).toBeInTheDocument()
})

test('singular cuando la zona tiene un solo sismo', () => {
  const data = statsBody({ most_active_region: { name: 'Alaska', count: 1 } })
  render(<StatsBar state={{ status: 'success', data }} />)
  expect(screen.getByText('1 sismo')).toBeInTheDocument()
})

test('sin datos muestra guiones', () => {
  const data = statsBody({ total_24h: 0, max_magnitude: null, most_active_region: null })
  render(<StatsBar state={{ status: 'success', data }} />)
  expect(screen.getByText('0')).toBeInTheDocument()
  expect(screen.getAllByText('—')).toHaveLength(2)
})

test('mientras carga indica que está cargando', () => {
  render(<StatsBar state={{ status: 'loading' }} />)
  expect(screen.getByRole('status')).toHaveTextContent('Cargando estadísticas…')
})

test('si falla lo dice sin romper la pantalla', () => {
  render(<StatsBar state={{ status: 'error' }} />)
  expect(screen.getByText('Estadísticas no disponibles')).toBeInTheDocument()
})
