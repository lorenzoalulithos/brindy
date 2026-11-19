import type { ReactNode } from 'react'
import { useT, type Loc } from '../core/i18n'
import { sfx } from '../core/feedback'
import type { Player } from '../core/store'
import { Sheet } from './GameShell'

/** Single swipeable row of big chips under the top bar (never wraps onto the 3D card). */
export function ChipRow({ children }: { children: ReactNode }) {
  return <div className="chip-scroll">{children}</div>
}

/** Big (drunk-proof) selectable chip; `locked` adds a 🔒 badge. */
export function Chip({ active, accent, locked, onClick, children }: { active?: boolean; accent: string; locked?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className={'chip' + (active ? ' active' : '')}
      style={{
        fontSize: 16,
        padding: '10px 14px',
        ...(active ? { background: accent, color: '#140818', borderColor: 'transparent', boxShadow: `0 0 18px ${accent}88` } : null),
      }}
      onClick={onClick}
    >
      {children}
      {locked && ' 🔒'}
    </button>
  )
}

const STAR_TITLE: Loc = { it: 'Chi è la star? ⭐', en: 'Who’s the star? ⭐', es: '¿Quién es la estrella? ⭐', fr: 'Qui est la star ? ⭐', de: 'Wer ist der Star? ⭐' }
const STAR_SUB: Loc = {
  it: 'La sposa o lo sposo della serata',
  en: 'The bride or groom of the night',
  es: 'La novia o el novio de la noche',
  fr: 'La future mariée ou le futur marié',
  de: 'Die Braut oder der Bräutigam des Abends',
}

/** One-tap picker for the hen/stag "star" of the night. */
export function StarPickerSheet({ players, current, onPick, onClose }: { players: Player[]; current?: string; onPick: (id: string) => void; onClose: () => void }) {
  const { L } = useT()
  return (
    <Sheet onClose={onClose}>
      <h2 className="center">{L(STAR_TITLE)}</h2>
      <p className="center">{L(STAR_SUB)}</p>
      <div style={{ display: 'grid', gridTemplateColumns: players.length > 6 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10, marginTop: 8 }}>
        {players.map((p) => (
          <button
            key={p.id}
            className="btn secondary small"
            style={{ minHeight: 56, padding: '0 8px', color: p.color, border: `2px solid ${p.color}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(p.id === current ? { background: p.color, color: '#140818' } : null) }}
            onClick={() => {
              sfx.tap()
              onPick(p.id)
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </Sheet>
  )
}
