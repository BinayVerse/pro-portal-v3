export function convertUnixTimestampToDate(ts: number | string): string {
  if (!ts && ts !== 0) return ''
  const n = typeof ts === 'string' ? Number(ts) : ts
  if (Number.isNaN(n)) return ''
  // Determine if seconds or milliseconds
  const ms = n > 1e12 ? n : n > 1e9 ? n * 1000 : n
  const d = new Date(ms)
  if (isNaN(d.getTime())) return ''
  return d.toISOString()
}

export function formatExpiryDate(month: number | string): string {
  if (month === undefined || month === null) return ''
  const m = typeof month === 'string' ? Number(month) : month
  if (Number.isNaN(m)) return ''
  return String(m).padStart(2, '0')
}

export function getEnv() {
  const config = useRuntimeConfig()
  const domain = config.public.appUrl
  if (domain.includes('localhost'))
    return 'dev'
  if (domain.includes('stage'))
    return 'stage'
  return 'prod'
}

export function isProd() {
  return getEnv() === 'prod'
}