import { simularApi } from './api-simulada'
import { expect, test } from './fixtures'

async function abrir(page: import('@playwright/test').Page, ancho: number) {
  await page.setViewportSize({ width: ancho, height: 900 })
  await simularApi(page)
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(2)
}

for (const ancho of [390, 768, 1440]) {
  test(`no hay scroll horizontal a ${ancho} px`, async ({ page }) => {
    await abrir(page, ancho)
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(sobra).toBeLessThanOrEqual(0)
  })
}

test('los controles miden al menos 44 px de alto en móvil', async ({ page }) => {
  await abrir(page, 390)
  const controles = [
    page.getByRole('button', { name: 'Última hora' }),
    page.getByRole('button', { name: 'Últimas 24 h' }),
    page.getByRole('button', { name: 'Últimos 7 días' }),
    page.getByLabel('Ordenar por'),
  ]
  for (const control of controles) {
    const caja = await control.boundingBox()
    expect(caja?.height ?? 0).toBeGreaterThanOrEqual(44)
  }
})

test('el foco con teclado se ve con un anillo de al menos 2 px', async ({ page }) => {
  await abrir(page, 1440)
  await page.keyboard.press('Tab')
  const anillo = await page.evaluate(() => {
    const estilo = getComputedStyle(document.activeElement as Element)
    return { estilo: estilo.outlineStyle, ancho: parseFloat(estilo.outlineWidth) }
  })
  expect(anillo.estilo).not.toBe('none')
  expect(anillo.ancho).toBeGreaterThanOrEqual(2)
})

test('los botones animan sus cambios, salvo con movimiento reducido', async ({ page }) => {
  await abrir(page, 1440)
  const duracion = () =>
    page
      .getByRole('button', { name: 'Última hora' })
      .evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(await duracion()).not.toMatch(/^0s(, 0s)*$/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await duracion()).toMatch(/^0s(, 0s)*$/)
})

test('usa Manrope para el texto y JetBrains Mono para las cifras', async ({ page }) => {
  await abrir(page, 1440)
  const fuentes = await page.evaluate(() => ({
    texto: getComputedStyle(document.body).fontFamily,
    cifra: getComputedStyle(document.querySelector('[data-figure]') as Element).fontFamily,
  }))
  expect(fuentes.texto).toContain('Manrope')
  expect(fuentes.cifra).toContain('JetBrains Mono')
})
