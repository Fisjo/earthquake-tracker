import { expect, test, type Page } from '@playwright/test'

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

const alfa = sismo('alfa', 'Sismo Alfa', 3.1, 5)
const beta = sismo('beta', 'Sismo Beta', 6.0, 30)

const stats = {
  total_24h: 120,
  max_magnitude: 6.2,
  most_active_region: { name: 'Chile', count: 14 },
  stale: false,
  warning: null,
}

async function simularApi(page: Page, opciones: { fallarListado?: () => boolean } = {}) {
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

test('el dashboard muestra las estadísticas y la lista de sismos', async ({ page }) => {
  await simularApi(page)
  await page.goto('/')
  await expect(page.getByText('Sismos en 24 h')).toBeVisible()
  await expect(page.getByText('120')).toBeVisible()
  await expect(page.getByText('M 6.2')).toBeVisible()
  await expect(page.getByText('Chile')).toBeVisible()
  await expect(page.getByText('14 sismos')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveText([/Sismo Alfa/, /Sismo Beta/])
})

test('cambiar la ventana actualiza la lista', async ({ page }) => {
  const pedidos = await simularApi(page)
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await page.getByRole('button', { name: 'Última hora' }).click()
  await expect(page.getByRole('listitem')).toHaveText([/Sismo Alfa/])
  expect(pedidos.at(-1)).toContain('window=hour')
})

test('cambiar el orden actualiza la lista', async ({ page }) => {
  const pedidos = await simularApi(page)
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveText([/Sismo Alfa/, /Sismo Beta/])
  await page.getByLabel('Ordenar por').selectOption('magnitude')
  await expect(page.getByRole('listitem')).toHaveText([/Sismo Beta/, /Sismo Alfa/])
  expect(pedidos.at(-1)).toContain('sort=magnitude')
})

test('si falla la carga se ve el error y Reintentar lo recupera', async ({ page }) => {
  let fallar = true
  await simularApi(page, { fallarListado: () => fallar })
  await page.goto('/')
  await expect(page.getByText('No se pudieron cargar los sismos.')).toBeVisible()
  fallar = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByText('No se pudieron cargar los sismos.')).toBeHidden()
})
