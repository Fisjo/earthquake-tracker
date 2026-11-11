import { vi } from 'vitest'
import type { Earthquake, EarthquakesResponse, Stats } from './api/types'

export function earthquake(overrides: Partial<Earthquake> = {}): Earthquake {
  return {
    usgs_id: 'us1',
    title: 'M 4.5 - 10 km N of Ficticia',
    place: '10 km N of Ficticia',
    magnitude: 4.5,
    depth: 10,
    latitude: 12.5,
    longitude: -70.25,
    occurred_at: '2026-01-01T11:55:00Z',
    alert_level: null,
    tsunami: false,
    significance: 300,
    ...overrides,
  }
}

export function listBody(
  earthquakes: Earthquake[],
  extra: Partial<EarthquakesResponse> = {},
): EarthquakesResponse {
  return { earthquakes, stale: false, warning: null, ...extra }
}

export function statsBody(overrides: Partial<Stats> = {}): Stats {
  return {
    total_24h: 120,
    max_magnitude: 6.2,
    most_active_region: { name: 'Chile', count: 14 },
    stale: false,
    warning: null,
    ...overrides,
  }
}

export type Reply = { status?: number; body: unknown }

/** Sustituye `fetch` por un doble que responde según la URL pedida. */
export function stubApi(handler: (url: URL) => Reply | Promise<Reply>) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    const { status = 200, body } = await handler(url)
    return new Response(JSON.stringify(body), { status })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

export function requestedUrls(fn: ReturnType<typeof stubApi>): string[] {
  return fn.mock.calls.map((call) => String(call[0]))
}
