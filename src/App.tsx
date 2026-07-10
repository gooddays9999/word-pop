import { ErrorBoundary } from './components/ErrorBoundary'
import { Toast } from './components/Toast'
import { BattleScreen } from './screens/BattleScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MapScreen } from './screens/MapScreen'
import { RecoveryScreen } from './screens/RecoveryScreen'
import { ResultsScreen } from './screens/ResultsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useAppStore } from './store/store'

function CurrentScreen() {
  const screen = useAppStore((state) => state.screen)
  switch (screen.name) {
    case 'title':
      return <TitleScreen />
    case 'home':
      return <HomeScreen />
    case 'map':
      return <MapScreen />
    case 'battle':
      return <BattleScreen />
    case 'results':
      return <ResultsScreen />
    case 'settings':
      return <SettingsScreen />
    case 'recovery':
      return <RecoveryScreen />
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="starfield" aria-hidden="true" />
      <div className="relative h-full overflow-y-auto">
        <CurrentScreen />
      </div>
      <Toast />
    </ErrorBoundary>
  )
}
