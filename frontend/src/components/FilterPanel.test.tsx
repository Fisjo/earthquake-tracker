import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { DEFAULT_FILTERS } from '../filters'
import type { Filters } from '../filters'
import FilterPanel from './FilterPanel'

function setup(filters: Filters = DEFAULT_FILTERS, counts: { total: number; shown: number } | null = null) {
  const onChange = vi.fn()
  const onReset = vi.fn()
  render(<FilterPanel filters={filters} onChange={onChange} counts={counts} onReset={onReset} />)
  return { onChange, onReset }
}

test('el deslizador cambia la magnitud mínima', () => {
  const { onChange } = setup()
  fireEvent.change(screen.getByLabelText('Magnitud mínima'), { target: { value: '4.5' } })
  expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, minMagnitude: 4.5 })
})

test('muestra el valor del deslizador en palabras', () => {
  const { rerender } = render(
    <FilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} counts={null} onReset={vi.fn()} />,
  )
  expect(screen.getByText('Todas')).toBeInTheDocument()
  rerender(
    <FilterPanel filters={{ ...DEFAULT_FILTERS, minMagnitude: 5 }} onChange={vi.fn()} counts={null} onReset={vi.fn()} />,
  )
  expect(screen.getByText('M 5.0 o más')).toBeInTheDocument()
})

test('ofrece las cuatro clases de profundidad, todas marcadas por defecto', () => {
  setup()
  for (const etiqueta of ['< 30 km', '30–70 km', '70–300 km', '≥ 300 km']) {
    expect(screen.getByLabelText(etiqueta)).toBeChecked()
  }
})

test('desmarcar una clase avisa con el nuevo conjunto', () => {
  const { onChange } = setup()
  fireEvent.click(screen.getByLabelText('30–70 km'))
  expect(onChange).toHaveBeenCalledWith({
    ...DEFAULT_FILTERS,
    depthClasses: [true, false, true, true],
  })
})

test('buscar un lugar avisa con el texto', () => {
  const { onChange } = setup()
  fireEvent.change(screen.getByLabelText('Buscar lugar'), { target: { value: 'Chile' } })
  expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, text: 'Chile' })
})

test('el contador dice cuántos sismos se muestran', () => {
  setup(DEFAULT_FILTERS, { total: 201, shown: 12 })
  expect(screen.getByRole('status')).toHaveTextContent('Mostrando 12 de 201 sismos')
})

test('el contador usa el singular y no aparece mientras carga', () => {
  const { unmount } = render(
    <FilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} counts={{ total: 1, shown: 1 }} onReset={vi.fn()} />,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Mostrando 1 de 1 sismo')
  unmount()
  setup(DEFAULT_FILTERS, null)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test('«Quitar filtros» solo aparece con filtros activos y los restablece', () => {
  const { unmount } = render(
    <FilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} counts={null} onReset={vi.fn()} />,
  )
  expect(screen.queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument()
  unmount()
  const { onReset } = setup({ ...DEFAULT_FILTERS, minMagnitude: 3 })
  fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))
  expect(onReset).toHaveBeenCalledOnce()
})

test('es un bloque plegable cuyo título indica cuántos filtros hay activos', () => {
  const { unmount } = render(
    <FilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} counts={null} onReset={vi.fn()} />,
  )
  expect(screen.getByText('Filtros').closest('summary')).toBeInTheDocument()
  expect(screen.queryByText('(1)')).not.toBeInTheDocument()
  unmount()
  setup({ ...DEFAULT_FILTERS, minMagnitude: 3 })
  expect(screen.getByText('(1)')).toBeInTheDocument()
})

test('el bloque se puede abrir y cerrar', () => {
  setup()
  const detalles = screen.getByText('Filtros').closest('details') as HTMLDetailsElement
  detalles.open = true
  fireEvent(detalles, new Event('toggle'))
  expect(detalles.open).toBe(true)
  detalles.open = false
  fireEvent(detalles, new Event('toggle'))
  expect(detalles.open).toBe(false)
})
