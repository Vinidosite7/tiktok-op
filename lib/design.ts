import type { CSSProperties } from 'react'

export const T = {
  bg:           '#0C0E14',
  bgDeep:       '#090B10',
  surface:      '#13161F',
  surfaceHover: '#181C27',
  border:  'rgba(255,255,255,0.06)',
  borderM: 'rgba(255,255,255,0.10)',
  borderB: 'rgba(255,255,255,0.15)',
  borderP: 'rgba(59,130,246,0.30)',
  text:  '#F0F2F7',
  sub:   '#7A859E',
  muted: '#3E4658',
  dim:   '#252B3B',
  green:  '#22C55E',
  red:    '#EF4444',
  amber:  '#F59E0B',
  blue:   '#3B82F6',
  blueDim:'#1D4ED8',
  cyan:   '#06B6D4',
  violet: '#8B5CF6',
  purple: '#8B5CF6',
  orange: '#F97316',
  blur:   'blur(16px)',
} as const

export const SANS = '"IBM Plex Sans", system-ui, sans-serif'
export const MONO = '"IBM Plex Mono", monospace'
export const SYNE = SANS
export const DM   = SANS

export const card: CSSProperties = {
  background:   '#13161F',
  border:       '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
}

export const cardDeep: CSSProperties = {
  background:     '#0F1219',
  border:         '1px solid rgba(255,255,255,0.08)',
  borderRadius:   12,
  backdropFilter: 'blur(16px)',
}

export const inp: CSSProperties = {
  background:  '#0C0E14',
  border:      '1px solid rgba(255,255,255,0.08)',
  color:       '#F0F2F7',
  borderRadius: 8,
  padding:     '9px 12px',
  fontSize:    13,
  outline:     'none',
  width:       '100%',
  fontFamily:  SANS,
  transition:  'border-color 0.15s',
}

export const radius = { sm: 6, md: 8, lg: 12, xl: 16 } as const

export const shadow = {
  sm:   '0 1px 3px rgba(0,0,0,0.4)',
  card: '0 4px 20px rgba(0,0,0,0.5)',
  deep: '0 8px 40px rgba(0,0,0,0.7)',
  blue: '0 0 20px rgba(59,130,246,0.25)',
} as const

export const btnPrimary: CSSProperties = {
  background:    '#3B82F6',
  color:         'white',
  border:        'none',
  cursor:        'pointer',
  fontFamily:    SANS,
  fontWeight:    500,
  letterSpacing: '0.01em',
}

export const btnGhost: CSSProperties = {
  background: 'transparent',
  color:      '#7A859E',
  border:     '1px solid rgba(255,255,255,0.08)',
  cursor:     'pointer',
  fontFamily: SANS,
}
