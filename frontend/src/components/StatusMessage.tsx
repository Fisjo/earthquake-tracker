export function LoadingMessage({ children }: { children: string }) {
  return (
    <p role="status" className="py-8 text-center text-muted">
      {children}
    </p>
  )
}

export function ErrorMessage({ children, onRetry }: { children: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-red-900">{children}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-sm bg-red-700 px-5 text-sm font-medium text-white transition-colors hover:bg-red-800 active:translate-y-px active:scale-[.985]"
      >
        Reintentar
      </button>
    </div>
  )
}

export function WarningBanner({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      {children}
    </p>
  )
}

export function EmptyMessage({ children }: { children: string }) {
  return <p className="py-8 text-center text-muted">{children}</p>
}
