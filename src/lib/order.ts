
/**
 * Utilities for formatting order reference numbers.
 */
export function formatOrderRefFromId(seed?: string | number | null) {
  // Use a deterministic number from seed when available, otherwise use timestamp + random
  let num: number
  if (seed == null) {
    num = Date.now() + Math.floor(Math.random() * 10000)
  } else if (typeof seed === "number") {
    num = seed
  } else {
    // derive a simple hash from string
    let h = 0
    for (let i = 0; i < seed.length; i++) {
      h = (h << 5) - h + seed.charCodeAt(i)
      h |= 0
    }
    num = Math.abs(h)
  }

  const four = String(num % 10000).padStart(4, "0")
  return `QM-${four}`
}
