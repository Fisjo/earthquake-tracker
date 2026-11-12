import { describe, expect, test } from 'vitest'
import { earthquake } from './test-utils'
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, isDefaultFilters } from './filters'
import type { Filters } from './filters'

const con = (cambios: Partial<Filters>): Filters => ({ ...DEFAULT_FILTERS, ...cambios })
const ids = (lista: ReturnType<typeof applyFilters>) => lista.map((e) => e.usgs_id)

describe('sin filtros', () => {
  test('lo muestra todo, incluso magnitudes negativas o nulas y profundidad nula', () => {
    const lista = [
      earthquake({ usgs_id: 'neg', magnitude: -0.8 }),
      earthquake({ usgs_id: 'nula', magnitude: null }),
      earthquake({ usgs_id: 'sinprof', depth: null }),
    ]
    expect(ids(applyFilters(lista, DEFAULT_FILTERS))).toEqual(['neg', 'nula', 'sinprof'])
  })

  test('isDefaultFilters distingue los filtros por defecto de los activos', () => {
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true)
    expect(isDefaultFilters(con({ minMagnitude: 1 }))).toBe(false)
    expect(isDefaultFilters(con({ depthClasses: [true, false, true, true] }))).toBe(false)
    expect(isDefaultFilters(con({ text: 'a' }))).toBe(false)
    expect(isDefaultFilters(con({ text: '   ' }))).toBe(true)
  })
})

describe('magnitud mínima', () => {
  const lista = [
    earthquake({ usgs_id: 'baja', magnitude: 4.4 }),
    earthquake({ usgs_id: 'justa', magnitude: 4.5 }),
    earthquake({ usgs_id: 'alta', magnitude: 6 }),
    earthquake({ usgs_id: 'nula', magnitude: null }),
  ]

  test('incluye la frontera y excluye lo inferior', () => {
    expect(ids(applyFilters(lista, con({ minMagnitude: 4.5 })))).toEqual(['justa', 'alta'])
  })

  test('un sismo sin magnitud se oculta en cuanto hay mínimo', () => {
    expect(ids(applyFilters(lista, con({ minMagnitude: 0.5 })))).not.toContain('nula')
  })
})

describe('profundidad', () => {
  const lista = [
    earthquake({ usgs_id: 'a', depth: 29.9 }),
    earthquake({ usgs_id: 'b', depth: 30 }),
    earthquake({ usgs_id: 'c', depth: 70 }),
    earthquake({ usgs_id: 'd', depth: 300 }),
    earthquake({ usgs_id: 'nula', depth: null }),
  ]

  test('deja solo las clases marcadas, con las fronteras de la leyenda', () => {
    expect(ids(applyFilters(lista, con({ depthClasses: [false, true, false, false] })))).toEqual(['b'])
    expect(ids(applyFilters(lista, con({ depthClasses: [true, false, false, false] })))).toEqual(['a'])
    expect(ids(applyFilters(lista, con({ depthClasses: [false, false, false, true] })))).toEqual(['d'])
  })

  test('sin profundidad solo se muestra si están marcadas las cuatro clases', () => {
    expect(ids(applyFilters(lista, DEFAULT_FILTERS))).toContain('nula')
    expect(ids(applyFilters(lista, con({ depthClasses: [true, true, true, false] })))).not.toContain('nula')
  })

  test('con todas las clases desmarcadas no queda nada', () => {
    expect(applyFilters(lista, con({ depthClasses: [false, false, false, false] }))).toEqual([])
  })
})

describe('búsqueda por lugar', () => {
  const lista = [
    earthquake({ usgs_id: 'pg', place: '21 km WNW of Popondetta, Papua New Guinea' }),
    earthquake({ usgs_id: 'ch', place: '27 km WSW of Calama, Chile' }),
    earthquake({ usgs_id: 'sin', place: null, title: 'M 2.0 - Región Ñandú' }),
  ]

  test('ignora mayúsculas y espacios alrededor', () => {
    expect(ids(applyFilters(lista, con({ text: '  CHILE ' })))).toEqual(['ch'])
  })

  test('ignora los acentos en ambos lados', () => {
    expect(ids(applyFilters(lista, con({ text: 'papúa' })))).toEqual(['pg'])
    expect(ids(applyFilters(lista, con({ text: 'popóndetta' })))).toEqual(['pg'])
    expect(ids(applyFilters(lista, con({ text: 'nandu' })))).toEqual(['sin'])
  })

  test('sin lugar busca en el título', () => {
    expect(ids(applyFilters(lista, con({ text: 'región' })))).toEqual(['sin'])
  })

  test('un texto que no coincide con nada deja la lista vacía', () => {
    expect(applyFilters(lista, con({ text: 'zzz' }))).toEqual([])
  })
})

test('los filtros se combinan', () => {
  const lista = [
    earthquake({ usgs_id: 'ok', magnitude: 5, depth: 10, place: 'Chile' }),
    earthquake({ usgs_id: 'poca', magnitude: 3, depth: 10, place: 'Chile' }),
    earthquake({ usgs_id: 'honda', magnitude: 5, depth: 400, place: 'Chile' }),
    earthquake({ usgs_id: 'otra', magnitude: 5, depth: 10, place: 'Peru' }),
  ]
  const filtros = con({ minMagnitude: 4, depthClasses: [true, true, true, false], text: 'chile' })
  expect(ids(applyFilters(lista, filtros))).toEqual(['ok'])
})

test('no modifica la lista original', () => {
  const lista = [earthquake({ usgs_id: 'a' }), earthquake({ usgs_id: 'b', magnitude: 1 })]
  applyFilters(lista, con({ minMagnitude: 4 }))
  expect(lista).toHaveLength(2)
})

describe('activeFilterCount', () => {
  test('sin filtros es 0', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0)
  })
  test('cuenta cada tipo de filtro una vez', () => {
    expect(activeFilterCount(con({ minMagnitude: 3 }))).toBe(1)
    expect(activeFilterCount(con({ depthClasses: [false, false, true, true] }))).toBe(1)
    expect(activeFilterCount(con({ text: 'chile' }))).toBe(1)
    expect(
      activeFilterCount(con({ minMagnitude: 3, depthClasses: [true, false, true, true], text: 'x' })),
    ).toBe(3)
  })
  test('un texto de solo espacios no cuenta', () => {
    expect(activeFilterCount(con({ text: '   ' }))).toBe(0)
  })
})
