import { useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T }

interface Settled<T> {
  load: unknown
  attempt: number
  result: { status: 'error' } | { status: 'success'; data: T }
  loadedAt: Date
}

const NEVER_LOADED = new Date(0)

/**
 * Ejecuta `load` al montar y cada vez que cambia (o se pide `reload`).
 * `load` debe tener identidad estable (useCallback o función de módulo).
 * Mientras el resultado guardado no corresponda a la petición actual, el estado es «loading»,
 * así que una respuesta de una petición anterior nunca se muestra.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const settle = (result: Settled<T>['result']) => {
      if (!controller.signal.aborted) {
        setSettled({ load, attempt, result, loadedAt: new Date() })
      }
    }
    load(controller.signal)
      .then((data) => settle({ status: 'success', data }))
      .catch(() => settle({ status: 'error' }))
    return () => controller.abort()
  }, [load, attempt])

  const current = settled?.load === load && settled.attempt === attempt ? settled : null
  const state: AsyncState<T> = current ? current.result : { status: 'loading' }
  return { state, loadedAt: current?.loadedAt ?? NEVER_LOADED, reload: () => setAttempt((n) => n + 1) }
}
