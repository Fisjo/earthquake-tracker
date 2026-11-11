import { expect, test as base } from '@playwright/test'

// Ninguna prueba depende de la red: las fuentes de Google se abortan y se usa la tipografía de respaldo.
export const test = base.extend<{ sinFuentesRemotas: void }>({
  sinFuentesRemotas: [
    async ({ page }, use) => {
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
      await use()
    },
    { auto: true },
  ],
})

export { expect }
