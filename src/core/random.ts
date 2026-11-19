export const rand = (min: number, max: number) => Math.random() * (max - min) + min
export const randInt = (min: number, maxInclusive: number) => Math.floor(Math.random() * (maxInclusive - min + 1)) + min
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Draws items without repetition until the pool is exhausted, then reshuffles. */
export function createDeck<T>(items: readonly T[]) {
  let pile = shuffle(items)
  return {
    draw(): T {
      if (pile.length === 0) pile = shuffle(items)
      return pile.pop()!
    },
    get remaining() {
      return pile.length
    },
  }
}
