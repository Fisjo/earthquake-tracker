export function LoadingMessage({ children }: { children: string }) {
  return (
    <p role="status" className="py-8 text-center text-slate-400">
      {children}
    </p>
  )
}

export function ErrorMessage({ children, onRetry }: { children: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-center">
      <p className="text-red-200">{children}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-md bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-400"
      >
        Reintentar
      </button>
    </div>
  )
}

export function WarningBanner({ children }: { children: string }) {
  return (
    <p role="alert" className="mb-4 rounded-lg border border-amber-500/40 bg-amber-950/40 p-3 text-sm text-amber-200">
      {children}
    </p>
  )
}

export function EmptyMessage({ children }: { children: string }) {
  return <p className="py-8 text-center text-slate-400">{children}</p>
}
