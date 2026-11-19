import { useEffect, useState } from 'react'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { sfx } from '../core/feedback'
import { Sheet } from './GameShell'
import { S } from './strings'

/** Players sorted by penalty points with animated bars in their colours. */
export function ScoreboardSheet({ onClose }: { onClose: () => void }) {
  const { t, L } = useT()
  const players = useApp((s) => s.players)
  const points = useApp((s) => s.points)
  const resetPoints = useApp((s) => s.resetPoints)
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const rows = players.map((p) => ({ ...p, pts: points[p.id] ?? 0 })).sort((a, b) => b.pts - a.pts)
  const max = Math.max(1, ...rows.map((r) => r.pts))
  const any = rows.some((r) => r.pts > 0)

  return (
    <Sheet onClose={onClose}>
      <h2 className="center">🏆 {L(S.scoreboard)}</h2>
      <p className="center" style={{ marginTop: 0 }}>
        {any ? L(S.scoreSub) : L(S.scoreEmpty)}
      </p>
      <div className="list" style={{ margin: '12px 0 18px' }}>
        {rows.map((r, i) => (
          <div key={r.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <div className="row">
              <span style={{ width: 26, textAlign: 'center' }}>{i === 0 && r.pts > 0 ? '👑' : i + 1}</span>
              <span className="dot" style={{ background: r.color, color: r.color }} />
              <span className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}
              </span>
              <b style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 20, color: r.color }}>
                {r.pts} {L(S.pts)}
              </b>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'var(--surface)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: grown ? `${(r.pts / max) * 100}%` : '0%',
                  background: r.color,
                  boxShadow: `0 0 12px ${r.color}`,
                  borderRadius: 99,
                  transition: `width 0.7s cubic-bezier(0.2, 1.3, 0.4, 1) ${i * 70}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="row">
        <button
          className="btn secondary"
          style={{ flex: 1 }}
          disabled={!any}
          onClick={() => {
            sfx.thud()
            resetPoints()
          }}
        >
          🔄 {L(S.reset)}
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </Sheet>
  )
}

export default ScoreboardSheet
