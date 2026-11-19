import type { ComponentType } from 'react'
import type { Loc } from './i18n'

export interface GameProps {
  /** Return to the home screen. */
  onExit: () => void
}

export type GameCategory = 'classic' | 'party' | 'skill'

export interface GameDef {
  id: string
  name: Loc
  tagline: Loc
  /** Short rules shown in the "Rules" sheet. Keep it to a few lines. */
  rules: Loc
  emoji: string
  /** Accent color (hex) used for the card on the home screen and the game's lighting. */
  color: string
  /** 0 when the game works without named players. */
  minPlayers: number
  category: GameCategory
  /** ISO date: before this the game shows as "coming soon" (drip release). */
  releaseAt?: string
  load: () => Promise<{ default: ComponentType<GameProps> }>
}
