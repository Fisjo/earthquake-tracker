export function formatMagnitude(magnitude: number | null): string {
  return magnitude === null ? 'M —' : `M ${magnitude.toFixed(1)}`
}

export function formatDepth(depth: number | null): string {
  if (depth === null) return 'Profundidad desconocida'
  return `${depth.toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`
}

export function formatRelativeTime(iso: string, now: Date): string {
  const seconds = Math.floor((now.getTime() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'hace unos segundos'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}
