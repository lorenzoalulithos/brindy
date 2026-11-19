import { GameShell } from './GameShell'
import type { GameProps } from '../core/types'

/** Temporary stand-in for games still being built. */
export function placeholder(gameId: string) {
  return function Placeholder({ onExit }: GameProps) {
    return (
      <GameShell
        gameId={gameId}
        onExit={onExit}
        scene={<div className="loading">🚧</div>}
      />
    )
  }
}
