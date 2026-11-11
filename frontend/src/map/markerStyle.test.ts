import { describe, expect, test } from 'vitest'
import { DEPTH_CLASSES, NO_DATA_COLOR, depthColor, magnitudeRadius } from './markerStyle'

describe('depthColor', () => {
  const [superficial, somera, intermedia, profunda] = DEPTH_CLASSES.map((c) => c.color)

  test.each([
    [0, superficial],
    [10, superficial],
    [29.9, superficial],
    [30, somera],
    [69.9, somera],
    [70, intermedia],
    [299.9, intermedia],
    [300, profunda],
    [700, profunda],
  ])('profundidad %s km', (depth, color) => {
    expect(depthColor(depth)).toBe(color)
  })

  test('una profundidad negativa (sobre el nivel del mar) cuenta como superficial', () => {
    expect(depthColor(-1.5)).toBe(superficial)
  })

  test('sin profundidad usa el color de «sin dato»', () => {
    expect(depthColor(null)).toBe(NO_DATA_COLOR)
  })

  test('las cuatro clases tienen colores distintos y ninguno es el de «sin dato»', () => {
    const colores = DEPTH_CLASSES.map((c) => c.color)
    expect(new Set(colores).size).toBe(4)
    expect(colores).not.toContain(NO_DATA_COLOR)
  })

  test('las clases están ordenadas de menor a mayor profundidad', () => {
    const minimos = DEPTH_CLASSES.map((c) => c.min)
    expect(minimos).toEqual([...minimos].sort((a, b) => a - b))
  })
})

describe('magnitudeRadius', () => {
  test('crece con la magnitud: 4 px en M 0 y 23,8 px en M 9', () => {
    expect(magnitudeRadius(0)).toBe(4)
    expect(magnitudeRadius(5)).toBeCloseTo(15)
    expect(magnitudeRadius(9)).toBeCloseTo(23.8)
  })

  test('es estrictamente creciente entre 0 y 9', () => {
    for (let m = 0; m < 9; m += 0.5) {
      expect(magnitudeRadius(m + 0.5)).toBeGreaterThan(magnitudeRadius(m))
    }
  })

  test('una magnitud negativa no baja del radio mínimo', () => {
    expect(magnitudeRadius(-0.8)).toBe(4)
  })

  test('una magnitud superior a 9 no pasa del radio máximo', () => {
    expect(magnitudeRadius(9.5)).toBeCloseTo(23.8)
  })

  test('sin magnitud usa el radio mínimo', () => {
    expect(magnitudeRadius(null)).toBe(4)
  })
})
