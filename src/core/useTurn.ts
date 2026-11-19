import { useCallback, useState } from 'react'
import { usePlayers, type Player } from './store'

const GUEST: Player = { id: 'guest', name: '🍻', color: '#ffd23d' }

/** Round-robin turn tracking over the current players. Falls back to a single guest. */
export function useTurn(startRandom = true) {
  const players = usePlayers()
  const list = players.length ? players : [GUEST]
  const [index, setIndex] = useState(() => (startRandom ? Math.floor(Math.random() * list.length) : 0))
  const current = list[index % list.length]
  const next = useCallback(() => setIndex((i) => (i + 1) % list.length), [list.length])
  const randomOther = useCallback(() => {
    const others = list.filter((p) => p.id !== current.id)
    return others.length ? others[Math.floor(Math.random() * others.length)] : current
  }, [list, current])
  return { players: list, current, index: index % list.length, next, randomOther, setIndex }
}
