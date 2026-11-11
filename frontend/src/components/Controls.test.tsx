import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Controls from './Controls'

function setup(window: 'hour' | 'day' | 'week' = 'day') {
  const onWindowChange = vi.fn()
  const onSortChange = vi.fn()
  render(
    <Controls
      window={window}
      sort="recent"
      onWindowChange={onWindowChange}
      onSortChange={onSortChange}
    />,
  )
  return { onWindowChange, onSortChange }
}

test('marca como pulsada la ventana activa', () => {
  setup('hour')
  expect(screen.getByRole('button', { name: 'Última hora' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Últimas 24 h' })).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByRole('button', { name: 'Últimos 7 días' })).toHaveAttribute('aria-pressed', 'false')
})

test('avisa al cambiar de ventana', () => {
  const { onWindowChange } = setup()
  fireEvent.click(screen.getByRole('button', { name: 'Últimos 7 días' }))
  expect(onWindowChange).toHaveBeenCalledWith('week')
})

test('ofrece los cuatro órdenes y avisa al cambiar', () => {
  const { onSortChange } = setup()
  const select = screen.getByLabelText('Ordenar por')
  const labels = Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
  expect(labels).toEqual([
    'Más recientes',
    'Mayor magnitud',
    'Mayor profundidad',
    'Más significativos',
  ])
  fireEvent.change(select, { target: { value: 'depth' } })
  expect(onSortChange).toHaveBeenCalledWith('depth')
})
