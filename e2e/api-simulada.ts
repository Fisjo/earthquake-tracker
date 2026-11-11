import type { Page } from '@playwright/test'

// La API se simula en el navegador: estas pruebas no tocan USGS ni la base de datos.
const hace = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString()

const sismo = (id: string, place: string, magnitude: number, minutos: number) => ({
  usgs_id: id,
  title: place,
  place,
  magnitude,
  depth: 10,
  latitude: 0,
  longitude: 0,
  occurred_at: hace(minutos),
  alert_level: null,
  tsunami: false,
  significance: 100,
})

export const alfa = sismo('alfa', 'Sismo Alfa', 3.1, 5)
export const beta = sismo('beta', 'Sismo Beta', 6.0, 30)

export const stats = {
  total_24h: 120,
  max_magnitude: 6.2,
  most_active_region: { name: 'Chile', count: 14 },
  stale: false,
  warning: null,
}

export async function simularApi(page: Page, opciones: { fallarListado?: () => boolean } = {}) {
  const pedidos: string[] = []
  await page.route(/\/api\/stats$/, (route) => route.fulfill({ json: stats }))
  await page.route(/\/api\/earthquakes\?/, (route) => {
    const url = new URL(route.request().url())
    pedidos.push(url.search)
    if (opciones.fallarListado?.()) return route.fulfill({ status: 500, json: {} })
    const ventana = url.searchParams.get('window')
    const orden = url.searchParams.get('sort')
    const lista = ventana === 'hour' ? [alfa] : orden === 'magnitude' ? [beta, alfa] : [alfa, beta]
    return route.fulfill({ json: { earthquakes: lista, stale: false, warning: null } })
  })
  return pedidos
}
