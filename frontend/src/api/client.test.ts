import { expect, test } from 'vitest'
import { requestedUrls, listBody, statsBody, stubApi } from '../test-utils'
import { ApiError, fetchEarthquakes, fetchStats } from './client'

test('fetchEarthquakes pide la ventana y el orden indicados', async () => {
  const fn = stubApi(() => ({ body: listBody([]) }))
  const data = await fetchEarthquakes('week', 'magnitude')
  expect(requestedUrls(fn)).toEqual(['/api/earthquakes?window=week&sort=magnitude'])
  expect(data).toEqual(listBody([]))
})

test('fetchStats pide /api/stats', async () => {
  const fn = stubApi(() => ({ body: statsBody() }))
  expect(await fetchStats()).toEqual(statsBody())
  expect(requestedUrls(fn)).toEqual(['/api/stats'])
})

test('un estado HTTP de error lanza ApiError', async () => {
  stubApi(() => ({ status: 500, body: {} }))
  await expect(fetchEarthquakes('day', 'recent')).rejects.toBeInstanceOf(ApiError)
  await expect(fetchStats()).rejects.toBeInstanceOf(ApiError)
})

test('pasa la señal de cancelación a fetch', async () => {
  const fn = stubApi(() => ({ body: listBody([]) }))
  const controller = new AbortController()
  await fetchEarthquakes('day', 'recent', controller.signal)
  const init = (fn.mock.calls[0] as unknown[])[1]
  expect(init).toMatchObject({ signal: controller.signal })
})
