// Ангийн төрөл бүр өөрийн өнгө, дүрслэлтэй
const THEMES = {
  hatha: { bg: '#BFE5D1', fg: '#0B3B2C', soft: '#9ED3B8' },
  vinyasa: { bg: '#B9D3FF', fg: '#0E2C6E', soft: '#93B8F8' },
  power: { bg: '#F8C25F', fg: '#4A2C00', soft: '#F2AC2E' },
  hiit: { bg: '#FF9D8E', fg: '#5C1510', soft: '#FF7E6B' },
  pilates: { bg: '#D6C7FF', fg: '#2B1A6B', soft: '#BDA7FA' },
}
const KEYS = Object.keys(THEMES)
const POSES = { hatha: 'seated', vinyasa: 'warrior', power: 'plank', hiit: 'jump', pilates: 'legraise' }

export function typeKey(name = '') {
  const n = name.toLowerCase()
  if (n.includes('hatha')) return 'hatha'
  if (n.includes('vinyasa') || n.includes('flow')) return 'vinyasa'
  if (n.includes('power')) return 'power'
  if (n.includes('hiit') || n.includes('cardio')) return 'hiit'
  if (n.includes('pilates')) return 'pilates'
  let h = 0
  for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return KEYS[h % KEYS.length]
}

export const typeTheme = (name) => THEMES[typeKey(name)]
export const poseFor = (name) => POSES[typeKey(name)]
export const themeByIndex = (i) => THEMES[KEYS[i % KEYS.length]]
