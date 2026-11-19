import { Component, Suspense, lazy, useEffect, useMemo, type ReactNode } from 'react'
import { useApp } from './core/store'
import { onGameFinished } from './core/ads'
import { gameById } from './games/registry'
import { Home } from './screens/Home'
import { AgeGate } from './screens/AgeGate'
import { AdOverlay } from './ui/AdOverlay'

// Secondary screens stay out of the entry chunk (Legal alone bundles ~25 KB of markdown).
const Onboarding = lazy(() => import('./screens/Onboarding').then((m) => ({ default: m.Onboarding })))
const Players = lazy(() => import('./screens/Players').then((m) => ({ default: m.Players })))
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })))
const Submit = lazy(() => import('./screens/Submit').then((m) => ({ default: m.Submit })))
const Legal = lazy(() => import('./screens/Legal').then((m) => ({ default: m.Legal })))

class GameErrorBoundary extends Component<{ children: ReactNode; onExit: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="screen center" style={{ justifyContent: 'center', gap: 16 }}>
        <div className="big-emoji">🥴</div>
        <h2>Oops!</h2>
        <button className="btn" onClick={this.props.onExit}>
          ←
        </button>
      </div>
    )
  }
}

function GameScreen({ id }: { id: string }) {
  const go = useApp((s) => s.go)
  const def = gameById(id)
  const Game = useMemo(() => (def ? lazy(def.load) : null), [def])
  const exit = () => {
    go({ name: 'home' })
    void onGameFinished()
  }
  if (!Game) return null
  return (
    <GameErrorBoundary onExit={exit}>
      <Suspense fallback={<div className="loading">{def?.emoji}</div>}>
        <Game onExit={exit} />
      </Suspense>
    </GameErrorBoundary>
  )
}

export default function App() {
  const screen = useApp((s) => s.screen)
  const ageOk = useApp((s) => s.ageOk)
  const onboarded = useApp((s) => s.onboarded)
  const lang = useApp((s) => s.lang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  if (!ageOk) return <AgeGate />
  if (!onboarded)
    return (
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
    )

  return (
    <>
      {screen.name === 'home' && <Home />}
      <Suspense fallback={null}>
        {screen.name === 'players' && <Players then={screen.then} />}
        {screen.name === 'settings' && <Settings />}
        {screen.name === 'submit' && <Submit />}
        {screen.name === 'legal' && <Legal key={screen.doc} doc={screen.doc} />}
      </Suspense>
      {screen.name === 'game' && <GameScreen key={screen.id} id={screen.id} />}
      <AdOverlay />
    </>
  )
}
