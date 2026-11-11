import { useState } from 'react'
import type { SortKey, Window } from './api/types'
import Controls from './components/Controls'
import EarthquakeList from './components/EarthquakeList'
import StatsBar from './components/StatsBar'
import { useEarthquakes } from './hooks/useEarthquakes'
import { useStats } from './hooks/useStats'

function Logo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-10 shrink-0 rounded-md bg-accent p-2 text-accent-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h4l2-6 4 12 3-9 2 3h5" />
    </svg>
  )
}

function App() {
  const [window, setWindow] = useState<Window>('day')
  const [sort, setSort] = useState<SortKey>('recent')
  const earthquakes = useEarthquakes(window, sort)
  const stats = useStats()

  return (
    <div className="min-h-screen bg-bg text-ink">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center gap-3">
          <Logo />
          <h1 className="text-3xl font-semibold tracking-tight">Earthquake Tracker</h1>
        </header>
        <StatsBar state={stats.state} />
        <Controls
          window={window}
          sort={sort}
          onWindowChange={setWindow}
          onSortChange={setSort}
        />
        <EarthquakeList
          state={earthquakes.state}
          onRetry={earthquakes.reload}
          now={earthquakes.loadedAt}
        />
      </main>
    </div>
  )
}

export default App
