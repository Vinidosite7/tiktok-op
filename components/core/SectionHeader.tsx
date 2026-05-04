'use client'

import { ReactNode } from 'react'
import { T, SANS } from '@/lib/design'
import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  sub?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function SectionHeader({ title, sub, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {Icon && <Icon size={16} color={T.muted} strokeWidth={2} />}
        <div>
          <h2 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          {sub && <p style={{ fontFamily: SANS, fontSize: 12, color: T.muted, margin: '2px 0 0' }}>{sub}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
