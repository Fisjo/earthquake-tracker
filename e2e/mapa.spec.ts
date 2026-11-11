import { simularApi } from './api-simulada'
import { expect, test } from './fixtures'

const marcadores = (page: import('@playwright/test').Page) => page.locator('path.leaflet-interactive')
const tarjeta = (page: import('@playwright/test').Page, lugar: string) =>
  page.getByRole('button', { name: new RegExp(lugar) })

test.beforeEach(async ({ page }) => {
  await simularApi(page)
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(2)
})

test('el mapa se carga con un marcador por cada sismo de la lista', async ({ page }) => {
  await expect(page.locator('.leaflet-container')).toBeVisible()
  await expect(marcadores(page)).toHaveCount(2)
  await expect(page.getByText('OpenStreetMap')).toBeVisible()
})

test('la leyenda explica el color y el tamaño', async ({ page }) => {
  await expect(page.getByText('Profundidad', { exact: true })).toBeVisible()
  await expect(page.getByText('Magnitud', { exact: true })).toBeVisible()
  await expect(page.getByText('< 30 km')).toBeVisible()
})

test('pulsar un marcador selecciona el sismo y abre su popup', async ({ page }) => {
  await marcadores(page).first().click()
  const popup = page.locator('.leaflet-popup-content')
  await expect(popup).toBeVisible()
  const lugar = (await popup.locator('p').first().innerText()).trim()
  await expect(page.locator('[aria-current="true"]')).toHaveCount(1)
  await expect(page.locator('[aria-current="true"]')).toContainText(lugar)
  await expect(popup.getByRole('link', { name: 'Ver en USGS' })).toBeVisible()
})

test('pulsar una tarjeta abre el popup de su sismo en el mapa', async ({ page }) => {
  await tarjeta(page, 'Sismo Alfa').click()
  await expect(page.locator('.leaflet-popup-content')).toContainText('Sismo Alfa')
  await expect(tarjeta(page, 'Sismo Alfa')).toHaveAttribute('aria-current', 'true')
  await tarjeta(page, 'Sismo Beta').click()
  await expect(page.locator('.leaflet-popup-content', { hasText: 'Sismo Beta' })).toBeVisible()
  // Leaflet tarda ~200 ms en retirar del DOM el popup anterior (animación de cierre).
  await expect(page.locator('.leaflet-popup-content')).toHaveCount(1)
  await expect(page.locator('[aria-current="true"]')).toHaveCount(1)
})

test('cambiar la ventana actualiza los marcadores', async ({ page }) => {
  await page.getByRole('button', { name: 'Última hora' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(marcadores(page)).toHaveCount(1)
})

test('cerrar el popup deja la lista sin selección', async ({ page }) => {
  await tarjeta(page, 'Sismo Alfa').click()
  await page.locator('.leaflet-popup-close-button').click()
  await expect(page.locator('[aria-current="true"]')).toHaveCount(0)
})

test('en escritorio el mapa queda a la derecha de la lista y en móvil encima', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const mapa = (await page.locator('.leaflet-container').boundingBox())!
  const lista = (await page.getByRole('list').boundingBox())!
  expect(mapa.x).toBeGreaterThan(lista.x + lista.width - 1)

  await page.setViewportSize({ width: 390, height: 844 })
  const mapaMovil = (await page.locator('.leaflet-container').boundingBox())!
  const listaMovil = (await page.getByRole('list').boundingBox())!
  expect(mapaMovil.y + mapaMovil.height).toBeLessThanOrEqual(listaMovil.y + 1)
})

test('en escritorio ningún control queda tapado por el mapa', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const mapa = (await page.locator('.leaflet-container').boundingBox())!
  for (const control of [
    page.getByRole('button', { name: 'Últimos 7 días' }),
    page.getByLabel('Ordenar por'),
  ]) {
    const caja = (await control.boundingBox())!
    expect(caja.x + caja.width).toBeLessThanOrEqual(mapa.x)
  }
})

test('la leyenda se ve entera en el primer pantallazo de escritorio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const leyenda = (await page.getByText('Magnitud', { exact: true }).locator('..').boundingBox())!
  expect(leyenda.y + leyenda.height).toBeLessThanOrEqual(900)
})

test('el popup es compacto: sin los márgenes de párrafo de Leaflet', async ({ page }) => {
  await tarjeta(page, 'Sismo Alfa').click()
  const margen = await page
    .locator('.leaflet-popup-content p')
    .first()
    .evaluate((el) => getComputedStyle(el).marginTop)
  expect(margen).toBe('0px')
})

test('en móvil la leyenda va debajo del mapa y no lo tapa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const mapa = (await page.locator('.leaflet-container').boundingBox())!
  const leyenda = (await page.getByText('Profundidad', { exact: true }).locator('..').boundingBox())!
  expect(leyenda.y).toBeGreaterThanOrEqual(mapa.y + mapa.height - 1)
})
