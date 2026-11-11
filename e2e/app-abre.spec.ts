import { expect, test } from './fixtures'

test('la app se abre y muestra su nombre', async ({ page }) => {
  // La pantalla pide sismos y estadísticas: se simulan para no tocar USGS ni la base de datos.
  await page.route(/\/api\/earthquakes\?/, (route) =>
    route.fulfill({ json: { earthquakes: [], stale: false, warning: null } }),
  )
  await page.route(/\/api\/stats$/, (route) =>
    route.fulfill({
      json: { total_24h: 0, max_magnitude: null, most_active_region: null, stale: false, warning: null },
    }),
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Earthquake Tracker' })).toBeVisible()
})

test('el frontend llega al backend a través del proxy', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  expect(await response.json()).toEqual({ status: 'ok' })
})
