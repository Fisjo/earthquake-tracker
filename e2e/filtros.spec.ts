import type { Page } from '@playwright/test'
import { simularApi } from './api-simulada'
import { expect, test } from './fixtures'

const marcadores = (page: Page) => page.locator('path.leaflet-interactive')
const tarjeta = (page: Page, lugar: string) => page.getByRole('button', { name: new RegExp(lugar) })

async function abrir(page: Page, ancho = 1440, alto = 900) {
  await page.setViewportSize({ width: ancho, height: alto })
  await simularApi(page)
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(2)
}

async function centro(locator: ReturnType<Page['locator']>) {
  const caja = (await locator.boundingBox())!
  return { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 }
}

test('la magnitud mínima reduce la lista y los marcadores, y el mapa se reencuadra', async ({ page }) => {
  await abrir(page)
  await page.getByLabel('Magnitud mínima').fill('5')
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(tarjeta(page, 'Sismo Beta')).toBeVisible()
  await expect(marcadores(page)).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveText('Mostrando 1 de 2 sismos')
  // El único sismo que queda debe acabar en el centro del mapa.
  await expect
    .poll(async () => {
      const mapa = await centro(page.locator('.leaflet-container'))
      const marcador = await centro(marcadores(page).first())
      return Math.hypot(mapa.x - marcador.x, mapa.y - marcador.y)
    })
    .toBeLessThan(60)
})

test('buscar un lugar filtra lista y mapa sin distinguir mayúsculas', async ({ page }) => {
  await abrir(page)
  await page.getByLabel('Buscar lugar').fill('ALFA')
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(tarjeta(page, 'Sismo Alfa')).toBeVisible()
  await expect(marcadores(page)).toHaveCount(1)
})

test('si ningún sismo coincide se avisa y Quitar filtros restablece todo', async ({ page }) => {
  await abrir(page)
  await page.getByLabel('< 30 km').uncheck() // los dos sismos de prueba tienen 10 km
  await expect(page.getByText('Ningún sismo coincide con los filtros.')).toBeVisible()
  await expect(marcadores(page)).toHaveCount(0)
  await page.getByRole('button', { name: 'Quitar filtros' }).last().click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(marcadores(page)).toHaveCount(2)
  await expect(page.getByLabel('< 30 km')).toBeChecked()
  await expect(page.getByLabel('Magnitud mínima')).toHaveValue('0')
})

test('pasar el ratón por una tarjeta resalta su marcador en el mapa', async ({ page }) => {
  await abrir(page)
  await expect(page.locator('path[stroke="#0a0a0a"]')).toHaveCount(0)
  await tarjeta(page, 'Sismo Alfa').hover()
  await expect(page.locator('path[stroke="#0a0a0a"]')).toHaveCount(1)
  await page.mouse.move(5, 5)
  await expect(page.locator('path[stroke="#0a0a0a"]')).toHaveCount(0)
})

test('pasar el ratón por un marcador resalta su tarjeta', async ({ page }) => {
  await abrir(page)
  await expect(page.locator('[data-highlighted="true"]')).toHaveCount(0)
  await marcadores(page).first().hover()
  await expect(page.locator('[data-highlighted="true"]')).toHaveCount(1)
  await page.mouse.move(5, 5)
  await expect(page.locator('[data-highlighted="true"]')).toHaveCount(0)
})

test('cambiar el orden no mueve el mapa', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.waitForTimeout(600)
  const antes = await centro(marcadores(page).first())
  await page.getByLabel('Ordenar por').selectOption('magnitude')
  await expect(page.getByRole('listitem').first()).toContainText('Sismo Beta')
  await page.waitForTimeout(600)
  const despues = await centro(marcadores(page).first())
  expect(Math.hypot(antes.x - despues.x, antes.y - despues.y)).toBeLessThan(2)
})

test('las estadísticas no cambian al filtrar y lo dicen', async ({ page }) => {
  await abrir(page)
  await expect(page.getByText('120')).toBeVisible()
  await page.getByLabel('Magnitud mínima').fill('5')
  await expect(page.getByText('120')).toBeVisible()
  await expect(page.getByText(/globales de las últimas 24 h/)).toBeVisible()
})

test('en escritorio los filtros están abiertos', async ({ page }) => {
  await abrir(page, 1440)
  await expect(page.getByLabel('Magnitud mínima')).toBeVisible()
})

test('en móvil los filtros están plegados, el mapa se ve en la primera pantalla y se pueden abrir', async ({ page }) => {
  await abrir(page, 390, 844)
  await expect(page.getByLabel('Magnitud mínima')).toBeHidden()
  const mapa = (await page.locator('.leaflet-container').boundingBox())!
  expect(mapa.y).toBeLessThan(844 - 120) // al menos 120 px del mapa visibles sin hacer scroll
  await page.getByText('Filtros', { exact: true }).click()
  await expect(page.getByLabel('Magnitud mínima')).toBeVisible()
})

test('los controles de filtro miden al menos 44 px en móvil', async ({ page }) => {
  await abrir(page, 390, 844)
  await page.getByText('Filtros', { exact: true }).click()
  for (const control of [
    page.getByLabel('Magnitud mínima'),
    page.getByLabel('Buscar lugar'),
    page.getByLabel('< 30 km').locator('..'),
    page.getByText('Filtros', { exact: true }).locator('xpath=ancestor::summary'),
  ]) {
    const caja = (await control.boundingBox())!
    expect(caja.height).toBeGreaterThanOrEqual(44)
  }
})
