import { useState } from 'react'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { sfx } from '../core/feedback'
import { gameById } from '../games/registry'

export function Players({ then }: { then?: string }) {
  const { t } = useT()
  const { players, addPlayer, removePlayer, go } = useApp()
  const [name, setName] = useState('')
  const game = then ? gameById(then) : undefined
  const need = game?.minPlayers ?? 0
  const ready = players.length >= need

  const add = () => {
    if (!name.trim()) return
    sfx.tap()
    addPlayer(name)
    setName('')
  }

  return (
    <div className="screen" style={{ gap: 14 }}>
      <div className="topbar">
        <button className="icon-btn" onClick={() => go({ name: 'home' })}>
          ←
        </button>
        <h2>👥 {t('players')}</h2>
        <div style={{ width: 46 }} />
      </div>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <input
          autoFocus
          value={name}
          maxLength={16}
          placeholder={t('playerName')}
          onChange={(e) => setName(e.target.value)}
          enterKeyHint="done"
        />
        <button type="submit" className="btn small" style={{ minWidth: 58 }} aria-label={t('addPlayer')}>
          +
        </button>
      </form>

      <div className="list">
        {players.map((p) => (
          <div key={p.id} className="list-item">
            <span className="dot" style={{ background: p.color, color: p.color }} />
            <span className="grow" style={{ fontSize: 18 }}>
              {p.name}
            </span>
            <button className="icon-btn" style={{ width: 36, height: 36, fontSize: 16 }} onClick={() => removePlayer(p.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="grow" />
      {need > 0 && !ready && <div className="center muted">{t('needPlayers', { n: need })}</div>}
      <button
        className="btn block"
        disabled={!ready}
        onClick={() => {
          sfx.reveal()
          go(then ? { name: 'game', id: then } : { name: 'home' })
        }}
      >
        {then ? `${game?.emoji ?? ''} ${t('letsGo')}` : t('close')}
      </button>
    </div>
  )
}
