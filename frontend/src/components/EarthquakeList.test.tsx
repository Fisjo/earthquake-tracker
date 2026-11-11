import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { earthquake, listBody } from '../test-utils'
import EarthquakeList from './EarthquakeList'

const now = new Date('2026-01-01T12:00:00Z')

test('pinta una tarjeta por sismo', () => {
  const data = listBody([
    earthquake({ usgs_id: 'a', place: 'Lugar A' }),
    earthquake({ usgs_id: 'b', place: 'Lugar B' }),
  ])
  render(<EarthquakeList state={{ status: 'success', data }} onRetry={vi.fn()} now={now} selectedId={null} onSelect={vi.fn()} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('Lugar A')).toBeInTheDocument()
  expect(screen.getByText('Lugar B')).toBeInTheDocument()
})

test('estado de carga', () => {
  render(<EarthquakeList state={{ status: 'loading' }} onRetry={vi.fn()} now={now} selectedId={null} onSelect={vi.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent('Cargando sismos…')
})

test('estado de error con reintento', () => {
  const onRetry = vi.fn()
  render(<EarthquakeList state={{ status: 'error' }} onRetry={onRetry} now={now} selectedId={null} onSelect={vi.fn()} />)
  expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los sismos')
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(onRetry).toHaveBeenCalledOnce()
})

test('lista vacía', () => {
  render(
    <EarthquakeList state={{ status: 'success', data: listBody([]) }} onRetry={vi.fn()} now={now} selectedId={null} onSelect={vi.fn()} />,
  )
  expect(screen.getByText('No hay sismos en este periodo.')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

test('aviso cuando los datos pueden estar desactualizados', () => {
  const data = listBody([earthquake()], { stale: true, warning: 'USGS no responde' })
  render(<EarthquakeList state={{ status: 'success', data }} onRetry={vi.fn()} now={now} selectedId={null} onSelect={vi.fn()} />)
  expect(screen.getByRole('alert')).toHaveTextContent('USGS no responde')
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})

test('sin aviso cuando los datos están al día', () => {
  const data = listBody([earthquake()])
  render(<EarthquakeList state={{ status: 'success', data }} onRetry={vi.fn()} now={now} selectedId={null} onSelect={vi.fn()} />)
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('resalta solo el sismo seleccionado y avisa al pulsar una tarjeta', () => {
  const onSelect = vi.fn()
  const data = listBody([
    earthquake({ usgs_id: 'a', place: 'Lugar A' }),
    earthquake({ usgs_id: 'b', place: 'Lugar B' }),
  ])
  render(
    <EarthquakeList state={{ status: 'success', data }} onRetry={vi.fn()} now={now} selectedId="b" onSelect={onSelect} />,
  )
  const tarjetas = screen.getAllByRole('button')
  expect(tarjetas[0]).not.toHaveAttribute('aria-current')
  expect(tarjetas[1]).toHaveAttribute('aria-current', 'true')
  fireEvent.click(tarjetas[0])
  expect(onSelect).toHaveBeenCalledWith('a')
})
