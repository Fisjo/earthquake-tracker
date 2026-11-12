import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'
import { earthquake, listBody, requestedUrls, statsBody, stubApi } from './test-utils'
import type { Reply } from './test-utils'
import type { Earthquake } from './api/types'

// Leaflet no funciona bien en jsdom: el mapa se sustituye por un doble con un botón por marcador.
vi.mock('./components/EarthquakeMap', () => ({
  default: (props: {
    earthquakes: Earthquake[]
    selectedId: string | null
    onSelect: (id: string | null) => void
    hoveredId: string | null
    onHover: (id: string | null) => void
    fitKey: string
  }) => (
    <div
      data-testid="mapa"
      data-selected={props.selectedId ?? ''}
      data-hovered={props.hoveredId ?? ''}
      data-fitkey={props.fitKey}
    >
      {props.earthquakes.map((e) => (
        <button
          key={e.usgs_id}
          type="button"
          onClick={() => props.onSelect(e.usgs_id)}
          onMouseEnter={() => props.onHover(e.usgs_id)}
          onMouseLeave={() => props.onHover(null)}
        >
          {`marcador ${e.usgs_id}`}
        </button>
      ))}
    </div>
  ),
}))

const alfa = earthquake({ usgs_id: 'alfa', place: 'Sismo Alfa', magnitude: 3.1 })
const beta = earthquake({ usgs_id: 'beta', place: 'Sismo Beta', magnitude: 6.0 })

function api(list: (url: URL) => Reply | Promise<Reply>) {
  return stubApi((url) => (url.pathname === '/api/stats' ? { body: statsBody() } : list(url)))
}

function lugares() {
  return screen.getAllByRole('listitem').map((li) => within(li).getByText(/Sismo/).textContent)
}

test('muestra el nombre de la app', async () => {
  api(() => ({ body: listBody([alfa]) }))
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Earthquake Tracker' })).toBeInTheDocument()
  await screen.findByText('Sismo Alfa')
})

test('carga la lista y las estadísticas al abrir, con 24 h y recientes por defecto', async () => {
  const fn = api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  expect(await screen.findByText('Sismo Alfa')).toBeInTheDocument()
  expect(await screen.findByText('120')).toBeInTheDocument()
  expect(requestedUrls(fn)).toContain('/api/earthquakes?window=day&sort=recent')
  expect(requestedUrls(fn)).toContain('/api/stats')
})

test('cambiar la ventana pide esa ventana y cambia la lista', async () => {
  const fn = api((url) => ({
    body: listBody(url.searchParams.get('window') === 'hour' ? [beta] : [alfa]),
  }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.click(screen.getByRole('button', { name: 'Última hora' }))
  expect(await screen.findByText('Sismo Beta')).toBeInTheDocument()
  expect(screen.queryByText('Sismo Alfa')).not.toBeInTheDocument()
  expect(requestedUrls(fn)).toContain('/api/earthquakes?window=hour&sort=recent')
})

test('cambiar el orden pide ese orden y reordena la lista', async () => {
  const fn = api((url) => ({
    body: listBody(url.searchParams.get('sort') === 'magnitude' ? [beta, alfa] : [alfa, beta]),
  }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  expect(lugares()).toEqual(['Sismo Alfa', 'Sismo Beta'])
  fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'magnitude' } })
  await waitFor(() => expect(lugares()).toEqual(['Sismo Beta', 'Sismo Alfa']))
  expect(requestedUrls(fn)).toContain('/api/earthquakes?window=day&sort=magnitude')
})

test('si falla la carga muestra el error y Reintentar lo recupera', async () => {
  let fallar = true
  api(() => (fallar ? { status: 500, body: {} } : { body: listBody([alfa]) }))
  render(<App />)
  expect(await screen.findByText('No se pudieron cargar los sismos.')).toBeInTheDocument()
  fallar = false
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByText('Sismo Alfa')).toBeInTheDocument()
  expect(screen.queryByText('No se pudieron cargar los sismos.')).not.toBeInTheDocument()
})

test('muestra el aviso cuando USGS no responde', async () => {
  api(() => ({ body: listBody([alfa], { stale: true, warning: 'USGS no responde' }) }))
  render(<App />)
  expect(await screen.findByText('USGS no responde')).toBeInTheDocument()
  expect(screen.getByText('Sismo Alfa')).toBeInTheDocument()
})

test('una respuesta lenta de una ventana anterior no pisa a la actual', async () => {
  const pendientes: Record<string, (reply: Reply) => void> = {}
  api(
    (url) =>
      new Promise<Reply>((resolve) => {
        pendientes[url.searchParams.get('window')!] = resolve
      }),
  )
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Última hora' }))
  await waitFor(() => expect(pendientes.hour).toBeDefined())
  pendientes.hour({ body: listBody([beta]) })
  await screen.findByText('Sismo Beta')
  pendientes.day({ body: listBody([alfa]) })
  await new Promise((r) => setTimeout(r, 20))
  expect(screen.getByText('Sismo Beta')).toBeInTheDocument()
  expect(screen.queryByText('Sismo Alfa')).not.toBeInTheDocument()
})

const tarjeta = (lugar: string) => screen.getByText(lugar).closest('button') as HTMLElement
const marcadores = () => screen.getAllByRole('button', { name: /^marcador / })

test('el mapa recibe los mismos sismos que la lista', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  await waitFor(() => expect(marcadores()).toHaveLength(2))
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})

test('pulsar un marcador selecciona su tarjeta', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.click(screen.getByRole('button', { name: 'marcador beta' }))
  expect(tarjeta('Sismo Beta')).toHaveAttribute('aria-current', 'true')
  expect(tarjeta('Sismo Alfa')).not.toHaveAttribute('aria-current')
})

test('pulsar una tarjeta pasa la selección al mapa', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', '')
  fireEvent.click(tarjeta('Sismo Alfa'))
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', 'alfa')
})

test('cambiar de ventana limpia la selección', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.click(tarjeta('Sismo Alfa'))
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', 'alfa')
  fireEvent.click(screen.getByRole('button', { name: 'Última hora' }))
  await screen.findByText('Sismo Alfa')
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', '')
})

test('cambiar el orden conserva la selección', async () => {
  api((url) => ({
    body: listBody(url.searchParams.get('sort') === 'magnitude' ? [beta, alfa] : [alfa, beta]),
  }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.click(tarjeta('Sismo Alfa'))
  fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'magnitude' } })
  await waitFor(() => expect(lugares()).toEqual(['Sismo Beta', 'Sismo Alfa']))
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', 'alfa')
  expect(tarjeta('Sismo Alfa')).toHaveAttribute('aria-current', 'true')
})

test('si el sismo seleccionado ya no está en la lista, no queda nada seleccionado', async () => {
  api((url) => ({
    body: listBody(url.searchParams.get('sort') === 'magnitude' ? [beta] : [alfa, beta]),
  }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.click(tarjeta('Sismo Alfa'))
  fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'magnitude' } })
  await screen.findByText('Sismo Beta')
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', '')
})

const fijarMagnitudMinima = (valor: string) =>
  fireEvent.change(screen.getByLabelText('Magnitud mínima'), { target: { value: valor } })

test('los filtros reducen la lista y lo que recibe el mapa', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  expect(screen.getByRole('status')).toHaveTextContent('Mostrando 2 de 2 sismos')
  fijarMagnitudMinima('5')
  expect(lugares()).toEqual(['Sismo Beta'])
  expect(marcadores().map((m) => m.textContent)).toEqual(['marcador beta'])
  expect(screen.getByRole('status')).toHaveTextContent('Mostrando 1 de 2 sismos')
})

test('buscar un lugar filtra lista y mapa', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.change(screen.getByLabelText('Buscar lugar'), { target: { value: 'alfa' } })
  expect(lugares()).toEqual(['Sismo Alfa'])
  expect(marcadores()).toHaveLength(1)
})

test('si ningún sismo coincide lo dice y Quitar filtros los restablece', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fijarMagnitudMinima('8')
  expect(screen.getByText('Ningún sismo coincide con los filtros.')).toBeInTheDocument()
  expect(screen.queryByText('No hay sismos en este periodo.')).not.toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Quitar filtros' })[0])
  expect(await screen.findByText('Sismo Alfa')).toBeInTheDocument()
  expect(lugares()).toEqual(['Sismo Alfa', 'Sismo Beta'])
  expect(screen.getByLabelText('Magnitud mínima')).toHaveValue('0')
})

test('una lista vacía sin filtros sigue diciendo que no hay sismos', async () => {
  api(() => ({ body: listBody([]) }))
  render(<App />)
  expect(await screen.findByText('No hay sismos en este periodo.')).toBeInTheDocument()
  expect(screen.queryByText('Ningún sismo coincide con los filtros.')).not.toBeInTheDocument()
})

test('si el filtro deja fuera al sismo seleccionado, no queda nada seleccionado', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.click(tarjeta('Sismo Alfa'))
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', 'alfa')
  fijarMagnitudMinima('5')
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-selected', '')
})

test('las estadísticas avisan de que no dependen de los filtros', async () => {
  api(() => ({ body: listBody([alfa]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  expect(
    screen.getByText('Las estadísticas son globales de las últimas 24 h y no dependen de los filtros.'),
  ).toBeInTheDocument()
})

test('pasar el ratón por una tarjeta la resalta en el mapa y al salir se quita', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.mouseEnter(tarjeta('Sismo Alfa'))
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-hovered', 'alfa')
  fireEvent.mouseLeave(tarjeta('Sismo Alfa'))
  expect(screen.getByTestId('mapa')).toHaveAttribute('data-hovered', '')
})

test('pasar el ratón por un marcador resalta su tarjeta', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  fireEvent.mouseEnter(screen.getByRole('button', { name: 'marcador beta' }))
  expect(tarjeta('Sismo Beta')).toHaveAttribute('data-highlighted', 'true')
  expect(tarjeta('Sismo Alfa')).not.toHaveAttribute('data-highlighted')
  fireEvent.mouseLeave(screen.getByRole('button', { name: 'marcador beta' }))
  expect(tarjeta('Sismo Beta')).not.toHaveAttribute('data-highlighted')
})

test('el mapa se reencuadra al cambiar filtros o ventana, pero no al ordenar', async () => {
  api(() => ({ body: listBody([alfa, beta]) }))
  render(<App />)
  await screen.findByText('Sismo Alfa')
  const clave = () => screen.getByTestId('mapa').getAttribute('data-fitkey')
  const inicial = clave()
  fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'magnitude' } })
  await screen.findByText('Sismo Alfa')
  expect(clave()).toBe(inicial)
  fijarMagnitudMinima('3')
  expect(clave()).not.toBe(inicial)
  const conFiltro = clave()
  fireEvent.click(screen.getByRole('button', { name: 'Última hora' }))
  await screen.findByText('Sismo Alfa')
  expect(clave()).not.toBe(conFiltro)
})
