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
  }) => (
    <div data-testid="mapa" data-selected={props.selectedId ?? ''}>
      {props.earthquakes.map((e) => (
        <button key={e.usgs_id} type="button" onClick={() => props.onSelect(e.usgs_id)}>
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
