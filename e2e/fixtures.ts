import { expect, test as base } from '@playwright/test'

// PNG transparente de 1x1 para las teselas del mapa.
const TESELA = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

// Ninguna prueba depende de la red: las fuentes de Google se abortan (se usa la tipografía de
// respaldo) y las teselas de OpenStreetMap se sustituyen por una imagen vacía.
export const test = base.extend<{ sinRedExterna: void }>({
  sinRedExterna: [
    async ({ page }, use) => {
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
      await page.route(/tile\.openstreetmap\.org/, (route) =>
        route.fulfill({ body: TESELA, contentType: 'image/png' }),
      )
      await use()
    },
    { auto: true },
  ],
})

export { expect }
