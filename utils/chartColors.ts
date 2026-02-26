export const APP_COLOR_MAP: Record<string, string> = {
  whatsapp: '#10B981', // emerald-500
  slack: '#ecb22e',    // slack yellow
  teams: '#3B82F6',    // blue-500
  admin: '#36c5f0',    // darker admin blue
}

const FALLBACK_PALETTE: string[] = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#8B5CF6', // violet-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#A855F7', // purple-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
]

const normalize = (label: string): string =>
  (label || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')

// Preferred app display order — known apps first
export const APP_ORDER = ['teams', 'whatsapp', 'slack', 'admin']

// Sort labels according to APP_ORDER. Unknown labels keep original relative order after known apps.
export const orderLabels = (labels: string[] = []): string[] => {
  const normalized = labels.map((l) => ({ raw: l, key: normalize(l) }))
  const known: { raw: string; key: string }[] = []
  const unknown: { raw: string; key: string }[] = []

  for (const item of normalized) {
    if (APP_ORDER.includes(item.key)) known.push(item)
    else unknown.push(item)
  }

  // Sort known according to APP_ORDER
  known.sort((a, b) => APP_ORDER.indexOf(a.key) - APP_ORDER.indexOf(b.key))

  // Return concatenated raw labels (known first, then unknown in original order)
  return [...known, ...unknown].map((i) => i.raw)
}

export const getAppColor = (label: string, index = 0): string => {
  const key = normalize(label)
  return APP_COLOR_MAP[key] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]
}

export const getColorsForLabels = (labels: string[]): string[] =>
  (labels || []).map((l, i) => getAppColor(l, i))
