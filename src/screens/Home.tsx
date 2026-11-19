import { useState, type CSSProperties } from 'react'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { sfx } from '../core/feedback'
import { GAMES, daysUntilRelease } from '../games/registry'
import type { GameCategory, GameDef } from '../core/types'
import { InstallCard, NextGameStrip, PartyMixButton, ScoreChip } from './HomeExtras'

type Filter = 'all' | GameCategory

export function Home() {
  const { t, L } = useT()
  const players = useApp((s) => s.players)
  const go = useApp((s) => s.go)
  const [filter, setFilter] = useState<Filter>('all')

  const open = (g: GameDef) => {
    if (daysUntilRelease(g) > 0) return
    sfx.tap()
    if (players.length < g.minPlayers) go({ name: 'players', then: g.id })
    else go({ name: 'game', id: g.id })
  }

  const list = GAMES.filter((g) => filter === 'all' || g.category === filter)

  return (
    <div className="screen" style={{ gap: 16 }}>
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="logo">Brindy</h1>
          <div className="muted" style={{ fontSize: 14, marginTop: -2 }}>
            {t('appTagline')}
          </div>
        </div>
        <div className="row">
          <ScoreChip />
          <button className="icon-btn" aria-label={t('settings')} onClick={() => go({ name: 'settings' })}>
            ⚙️
          </button>
        </div>
      </header>

      <PartyMixButton />

      <button className="players-bar" onClick={() => go({ name: 'players' })}>
        <span style={{ fontSize: 22 }}>👥</span>
        <span className="grow" style={{ textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {players.length ? players.map((p) => p.name).join(' · ') : t('addPlayer')}
        </span>
        <span className="chip">{players.length}</span>
      </button>

      <InstallCard />
      <NextGameStrip />

      <div className="row" style={{ overflowX: 'auto', paddingBottom: 2 }}>
        {(['all', 'classic', 'party', 'skill'] as Filter[]).map((f) => (
          <button key={f} className={'chip' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
            {f === 'all' ? t('allGames') : t(f)}
          </button>
        ))}
      </div>

      <div className="game-grid">
        {list.map((g, i) => {
          const days = daysUntilRelease(g)
          const isNew = !days && g.releaseAt && Date.now() - new Date(g.releaseAt).getTime() < 7 * 86_400_000
          return (
            <button
              key={g.id}
              className={'game-card' + (days ? ' locked' : '')}
              style={{ '--accent': g.color, animationDelay: `${i * 40}ms` } as CSSProperties}
              onClick={() => open(g)}
            >
              {isNew && <span className="badge">{t('newBadge')}</span>}
              {days > 0 && <span className="badge soon">{t('comingIn', { n: days })}</span>}
              <span className="game-emoji">{g.emoji}</span>
              <span className="game-name">{L(g.name)}</span>
              <span className="game-tag">{L(g.tagline)}</span>
            </button>
          )
        })}
        <button className="game-card suggest" onClick={() => go({ name: 'submit' })}>
          <span className="game-emoji">💡</span>
          <span className="game-name">{t('suggestGame')}</span>
          <span className="game-tag">{t('suggestSub')}</span>
        </button>
      </div>

      <div className="fineprint">🔞 {t('responsible')}</div>
    </div>
  )
}
