'use client'

import { ReactNode } from 'react'
import { T, SANS, card, radius } from '@/lib/design'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value?: number
  valueString?: string
  color?: string
  icon?: LucideIcon
  sub?: string
  format?: (v: number) => string
  onClick?: () => void
  children?: ReactNode
}

export function KPICard({
  label, value, valueString, color = T.blue,
  icon: Icon, sub, format, onClick, children,
}: KPICardProps) {
  const displayed = valueString ?? (format && value !== undefined ? format(value) : value?.toLocaleString('pt-BR'))

  return (
    <div
      onClick={onClick}
      style={{
        ...card,
        borderRadius: radius.lg,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={13} color={color} strokeWidth={2.5} />
          </div>
        )}
      </div>
      {displayed !== undefined && (
        <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {displayed}
        </div>
      )}
      {children}
      {sub && <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted }}>{sub}</div>}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: color, opacity: 0.4, borderRadius: '12px 0 0 12px' }} />
    </div>
  )
}
