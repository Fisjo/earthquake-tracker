import { useState } from 'react'
import type { SortKey, Window } from './api/types'
import Controls from './components/Controls'
import EarthquakeList from './components/EarthquakeList'
import EarthquakeMap from './components/EarthquakeMap'
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
  const [selection, setSelection] = useState<string | null>(null)
  const earthquakes = useEarthquakes(window, sort)
  const stats = useStats()

  const items = earthquakes.state.status === 'success' ? earthquakes.state.data.earthquakes : []
  // Una selección solo vale mientras ese sismo siga en la lista.
  const selectedId = items.some((e) => e.usgs_id === selection) ? selection : null

  const changeWindow = (next: Window) => {
    setSelection(null)
    setWindow(next)
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
        <header className="flex items-center gap-3 lg:col-span-2">
          <Logo />
          <h1 className="text-3xl font-semibold tracking-tight">Earthquake Tracker</h1>
        </header>
        <div className="lg:col-start-1">
          <StatsBar state={stats.state} />
        </div>
        <div className="lg:col-start-1">
          <Controls
            window={window}
            sort={sort}
            onWindowChange={changeWindow}
            onSortChange={setSort}
          />
        </div>
        <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-3 lg:row-start-2 lg:h-[calc(100vh-8rem)]">
          <EarthquakeMap earthquakes={items} selectedId={selectedId} onSelect={setSelection} />
        </div>
        <div className="lg:col-start-1">
          <EarthquakeList
            state={earthquakes.state}
            onRetry={earthquakes.reload}
            now={earthquakes.loadedAt}
            selectedId={selectedId}
            onSelect={setSelection}
          />
        </div>
      </main>
    </div>
  )
}

export default App
