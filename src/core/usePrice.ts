import { useEffect, useState } from 'react'
import { priceOf, type Sku } from './purchases'

/** Localized store price for a SKU on native builds; `fallback` on web or while loading. */
export function usePrice(sku: Sku, fallback: string) {
  const [price, setPrice] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    void priceOf(sku).then((p) => alive && setPrice(p))
    return () => {
      alive = false
    }
  }, [sku])
  return price ?? fallback
}
