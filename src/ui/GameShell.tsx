import { useState, type CSSProperties, type ReactNode } from 'react'
import { useT } from '../core/i18n'
import { gameById } from '../games/registry'
import { sfx } from '../core/feedback'
import type { Player } from '../core/store'
import { ScoreButton } from './Scoreboard'

/**
 * Standard frame for every game: full-screen 3D layer (`scene`) plus a HUD
 * with back button, title, rules sheet, and a bottom area for actions.
 */
export function GameShell({
  gameId,
  onExit,
  scene,
  top,
  bottom,
  overlay,
}: {
  gameId: string
  onExit: () => void
  /** Usually a <Stage> with the 3D content. */
  scene: ReactNode
  /** Extra HUD content under the top bar (e.g. turn pill). */
  top?: ReactNode
  /** Bottom HUD content (result card, buttons). */
  bottom?: ReactNode
  /** Anything that must cover the whole game (setup screens, modals). */
  overlay?: ReactNode
}) {
  const { t, L } = useT()
  const game = gameById(gameId)
  const [showRules, setShowRules] = useState(false)
  const accent = game?.color ?? '#ff3d8b'

  return (
    <div className="game" style={{ '--accent': accent } as CSSProperties}>
      {scene}
      <div className="game-hud">
        <div className="topbar">
          <button
            className="icon-btn"
            aria-label={t('back')}
            onClick={() => {
              sfx.tap()
              onExit()
            }}
          >
            ←
          </button>
          <h2>
            {game?.emoji} {game ? L(game.name) : ''}
          </h2>
          <ScoreButton />
          <button
            className="icon-btn"
            aria-label={t('rules')}
            onClick={() => {
              sfx.tap()
              setShowRules(true)
            }}
          >
            ?
          </button>
        </div>
        {top}
        <div className="spacer" />
        <div className="hud-bottom">{bottom}</div>
      </div>
      {overlay}
      {showRules && game && (
        <Sheet onClose={() => setShowRules(false)}>
          <div className="big-emoji center">{game.emoji}</div>
          <h2 className="center" style={{ marginTop: 8 }}>
            {L(game.name)}
          </h2>
          <p>{L(game.rules)}</p>
          <button className="btn block" onClick={() => setShowRules(false)}>
            {t('close')}
          </button>
        </Sheet>
      )}
    </div>
  )
}

export function Sheet({ children, onClose, center }: { children: ReactNode; onClose?: () => void; center?: boolean }) {
  return (
    <div className={'backdrop' + (center ? ' center' : '')} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

/** "It's Marco's turn" pill. */
export function TurnPill({ player, label }: { player: Player; label?: string }) {
  const { t } = useT()
  return (
    <div className="turn-pill" key={player.id} style={{ '--accent': player.color } as CSSProperties}>
      {label ?? t('turnOf')} <b>{player.name}</b>
    </div>
  )
}

/** Big neon result card for the bottom HUD. Re-animates when `animKey` changes. */
export function ResultCard({
  who,
  big,
  sub,
  color,
  animKey,
  onClick,
}: {
  who?: ReactNode
  big: ReactNode
  sub?: ReactNode
  color?: string
  animKey?: string | number
  onClick?: () => void
}) {
  return (
    <div className="result" key={animKey} onClick={onClick} style={color ? ({ '--accent': color } as CSSProperties) : undefined}>
      {who && <div className="who">{who}</div>}
      <div className="big">{big}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}
