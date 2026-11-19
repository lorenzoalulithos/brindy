import { Suspense, lazy, useState } from 'react'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { sfx } from '../core/feedback'
import { S } from './strings'

/** The sheet itself is loaded on demand; only the buttons are in the entry chunk. */
const LazySheet = lazy(() => import('./ScoreboardSheet'))

export function ScoreboardSheet({ onClose }: { onClose: () => void }) {
  return (
    <Suspense fallback={null}>
      <LazySheet onClose={onClose} />
    </Suspense>
  )
}

/** 🏆 icon button for the game top bar; renders nothing unless penalty mode is "points". */
export function ScoreButton() {
  const mode = useApp((s) => s.penaltyMode)
  const [open, setOpen] = useState(false)
  const { L } = useT()
  if (mode !== 'points') return null
  return (
    <>
      <button
        className="icon-btn"
        aria-label={L(S.scoreboard)}
        onClick={() => {
          sfx.tap()
          setOpen(true)
        }}
      >
        🏆
      </button>
      {open && <ScoreboardSheet onClose={() => setOpen(false)} />}
    </>
  )
}
