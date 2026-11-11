import { expect, test } from '@playwright/test'

test('la app se abre y muestra su nombre', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Earthquake Tracker' })).toBeVisible()
})

test('el frontend llega al backend a través del proxy', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  expect(await response.json()).toEqual({ status: 'ok' })
})
