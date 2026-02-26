export function formatCompactNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (!isFinite(num) || num === 0) return '0'
  const abs = Math.abs(num)
  if (abs >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (abs >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}
