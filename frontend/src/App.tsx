import { useState } from 'react'
import type { SortKey, Window } from './api/types'
import Controls from './components/Controls'
import EarthquakeList from './components/EarthquakeList'
import StatsBar from './components/StatsBar'
import { useEarthquakes } from './hooks/useEarthquakes'
import { useStats } from './hooks/useStats'

function App() {
  const [window, setWindow] = useState<Window>('day')
  const [sort, setSort] = useState<SortKey>('recent')
  const earthquakes = useEarthquakes(window, sort)
  const stats = useStats()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <h1 className="text-3xl font-bold">Earthquake Tracker</h1>
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
