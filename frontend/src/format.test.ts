import { describe, expect, test } from 'vitest'
import { formatDepth, formatMagnitude, formatRelativeTime } from './format'

describe('formatMagnitude', () => {
  test('una cifra decimal', () => {
    expect(formatMagnitude(4.5)).toBe('M 4.5')
    expect(formatMagnitude(6)).toBe('M 6.0')
    expect(formatMagnitude(4.56)).toBe('M 4.6')
  })
  test('nula', () => {
    expect(formatMagnitude(null)).toBe('M —')
  })
})

describe('formatDepth', () => {
  test('en km con coma decimal', () => {
    expect(formatDepth(10)).toBe('10 km')
    expect(formatDepth(10.54)).toBe('10,5 km')
    expect(formatDepth(0)).toBe('0 km')
  })
  test('nula', () => {
    expect(formatDepth(null)).toBe('Profundidad desconocida')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-01T12:00:00Z')
  const at = (iso: string) => formatRelativeTime(iso, now)

  test('segundos', () => {
    expect(at('2026-01-01T11:59:30Z')).toBe('hace unos segundos')
    expect(at('2026-01-01T11:59:01Z')).toBe('hace unos segundos')
  })
  test('minutos', () => {
    expect(at('2026-01-01T11:59:00Z')).toBe('hace 1 min')
    expect(at('2026-01-01T11:55:00Z')).toBe('hace 5 min')
    expect(at('2026-01-01T11:00:01Z')).toBe('hace 59 min')
  })
  test('horas', () => {
    expect(at('2026-01-01T11:00:00Z')).toBe('hace 1 h')
    expect(at('2026-01-01T00:00:01Z')).toBe('hace 11 h')
  })
  test('días', () => {
    expect(at('2025-12-31T12:00:00Z')).toBe('hace 1 d')
    expect(at('2025-12-25T12:00:00Z')).toBe('hace 7 d')
  })
  test('una fecha futura (reloj desajustado) no da valores negativos', () => {
    expect(at('2026-01-01T12:05:00Z')).toBe('hace unos segundos')
  })
})
