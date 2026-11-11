import { expect, test } from './fixtures'
import { simularApi } from './api-simulada'

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
