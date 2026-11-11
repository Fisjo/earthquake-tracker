import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { earthquake } from '../test-utils'
import EarthquakeCard from './EarthquakeCard'

const now = new Date('2026-01-01T12:00:00Z')

test('muestra magnitud, lugar, profundidad y hora relativa', () => {
  render(<EarthquakeCard earthquake={earthquake()} now={now} selected={false} onSelect={vi.fn()} />)
  expect(screen.getByText('M 4.5')).toBeInTheDocument()
  expect(screen.getByText('10 km N of Ficticia')).toBeInTheDocument()
  expect(screen.getByText('10 km')).toBeInTheDocument()
  expect(screen.getByText('hace 5 min')).toBeInTheDocument()
})

test('sin lugar usa el título', () => {
  render(<EarthquakeCard earthquake={earthquake({ place: null, title: 'Título' })} now={now} selected={false} onSelect={vi.fn()} />)
  expect(screen.getByText('Título')).toBeInTheDocument()
})

test('magnitud y profundidad nulas', () => {
  render(<EarthquakeCard earthquake={earthquake({ magnitude: null, depth: null })} now={now} selected={false} onSelect={vi.fn()} />)
  expect(screen.getByText('M —')).toBeInTheDocument()
  expect(screen.getByText('Profundidad desconocida')).toBeInTheDocument()
})

test('marca de tsunami solo cuando corresponde', () => {
  const { rerender } = render(<EarthquakeCard earthquake={earthquake()} now={now} selected={false} onSelect={vi.fn()} />)
  expect(screen.queryByText('Marca de tsunami')).not.toBeInTheDocument()
  rerender(<EarthquakeCard earthquake={earthquake({ tsunami: true })} now={now} selected={false} onSelect={vi.fn()} />)
  expect(screen.getByText('Marca de tsunami')).toBeInTheDocument()
})

test('pulsar la tarjeta avisa con el id del sismo', () => {
  const onSelect = vi.fn()
  render(<EarthquakeCard earthquake={earthquake({ usgs_id: 'abc' })} now={now} selected={false} onSelect={onSelect} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onSelect).toHaveBeenCalledWith('abc')
})

test('marca con aria-current solo la tarjeta seleccionada', () => {
  const { rerender } = render(
    <EarthquakeCard earthquake={earthquake()} now={now} selected={false} onSelect={vi.fn()} />,
  )
  expect(screen.getByRole('button')).not.toHaveAttribute('aria-current')
  rerender(<EarthquakeCard earthquake={earthquake()} now={now} selected onSelect={vi.fn()} />)
  expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true')
})

test('al seleccionarse se desplaza a la vista', () => {
  const scrollIntoView = vi.fn()
  Element.prototype.scrollIntoView = scrollIntoView
  const { rerender } = render(
    <EarthquakeCard earthquake={earthquake()} now={now} selected={false} onSelect={vi.fn()} />,
  )
  expect(scrollIntoView).not.toHaveBeenCalled()
  rerender(<EarthquakeCard earthquake={earthquake()} now={now} selected onSelect={vi.fn()} />)
  expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
})
