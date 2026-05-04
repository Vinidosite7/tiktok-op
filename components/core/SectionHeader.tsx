'use client'

/**
 * SectionHeader — cabeçalho padrão de página
 *
 * Cobre todos os padrões de header encontrados no projeto:
 *   - Título + subtítulo simples
 *   - Título + live dot (para dashboards ao vivo)
 *   - Título + subtítulo dinâmico (contagem de registros)
 *   - Título + CTA (botão Novo)
 *   - data-tour integrado
 *
 * Exemplos:
 *
 * Simples:
 *   <SectionHeader title="Clientes" />
 *
 * Com live dot e CTA:
 *   <SectionHeader
 *     title="Dashboard"
 *     subtitle={`${business.name} · ${month}`}
 *     live
 *     cta={{ label: 'Novo lançamento', labelMobile: 'Novo', icon: Plus, onClick: openModal }}
 *   />
 *
 * Com subtítulo de contagem:
 *   <SectionHeader
 *     title="Vendas"
 *     subtitle={`${count} ${count === 1 ? 'venda' : 'vendas'} registradas`}
 *     cta={{ label: 'Nova venda', labelMobile: 'Novo', icon: Plus, onClick: openCreate }}
 *     tourId="vendas-header"
 *   />
 *
 * Com data-tour e delay de entrada:
 *   <SectionHeader
 *     title="Financeiro"
 *     subtitle="Receitas e despesas"
 *     cta={{ label: 'Novo lançamento', icon: Plus, onClick: openModal }}
 *     tourId="fin-header"
 *     delay={0}
 *   />
 */

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { ShimmerButton, LiveDot } from '@/components/ui/primitives'
import { T, SYNE } from '@/lib/design'
import type { LucideIcon } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SectionCTA {
  label:        string
  /** Texto no mobile (<640px). Se omitido usa label. */
  labelMobile?: string
  icon?:        LucideIcon
  onClick:      () => void
  disabled?:    boolean
}

export interface SectionHeaderProps {
  title:      string
  subtitle?:  string
  /** Mostra LiveDot verde antes do subtítulo */
  live?:      boolean
  liveColor?: string
  /** CTA direito (botão Novo) */
  cta?:       SectionCTA
  /** Delay de entrada framer-motion */
  delay?:     number
  /** data-tour para o tour guiado */
  tourId?:    string
  className?: string
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  live      = false,
  liveColor = T.green,
  cta,
  delay     = 0,
  tourId,
  className = '',
}: SectionHeaderProps) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`flex items-start justify-between gap-4 ${className}`}
      {...(tourId ? { 'data-tour': tourId } : {})}
    >
      {/* Texto */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: SYNE, color: T.text }}
        >
          {title}
        </h1>

        {subtitle && (
          <div className="flex items-center gap-2 mt-1">
            {live && <LiveDot color={liveColor} />}
            <p className="text-sm" style={{ color: T.muted, fontFamily: SYNE }}>
              {subtitle}
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {cta && (
        <ShimmerButton
          onClick={cta.onClick}
          disabled={cta.disabled}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{
            background: cta.disabled
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)',
            color:      cta.disabled ? T.muted : 'white',
            boxShadow:  cta.disabled ? 'none' : '0 0 28px rgba(124,110,247,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
            border:     cta.disabled ? `1px solid ${T.border}` : '1px solid rgba(255,255,255,0.1)',
            cursor:     cta.disabled ? 'not-allowed' : 'pointer',
            fontFamily: SYNE,
            opacity:    cta.disabled ? 0.6 : 1,
          }}
        >
          {cta.icon && <cta.icon size={15} />}
          {cta.labelMobile
            ? (
              <>
                <span className="hidden sm:inline">{cta.label}</span>
                <span className="sm:hidden">{cta.labelMobile}</span>
              </>
            )
            : <span>{cta.label}</span>
          }
        </ShimmerButton>
      )}
    </motion.div>
  )
}
