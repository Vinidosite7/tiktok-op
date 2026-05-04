'use client'

/**
 * KPICard — card de métrica principal
 *
 * Aceita valor numérico (com animação de contagem) ou valor já formatado como string.
 *
 * Exemplos:
 *
 * Numérico com badge de variação:
 *   <KPICard
 *     label="Faturamento"
 *     value={stats.income}
 *     color={T.green}
 *     icon={TrendingUp}
 *     format={fmtShort}
 *     change={{ value: '12.4', up: true }}
 *   />
 *
 * Numérico com invertBadge (subir = ruim):
 *   <KPICard
 *     label="Despesas"
 *     value={stats.expense}
 *     color={T.red}
 *     icon={TrendingDown}
 *     format={fmtShort}
 *     change={expenseChange}
 *     invertBadge
 *   />
 *
 * String (sem animação de contagem):
 *   <KPICard
 *     label="Recebido"
 *     valueString={fmtShort(totalPaid)}
 *     color={T.green}
 *     icon={DollarSign}
 *     sub="Vendas pagas"
 *   />
 *
 * Clicável (navega para outra rota):
 *   <KPICard
 *     label="Clientes"
 *     value={stats.clients}
 *     color={T.amber}
 *     icon={Users}
 *     format={v => String(Math.round(v))}
 *     sub="ativos"
 *     href="/clientes"
 *   />
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { SpotlightCard, GlowCorner } from '@/components/ui/effects'
import { T as tok, SYNE, card } from '@/lib/design'
import type { LucideIcon } from 'lucide-react'

// ─── AnimatedNumber ───────────────────────────────────────────────────────────
// RAF puro — evita conflito framer-motion animate + motion no Turbopack
function AnimatedNumber({
  value,
  format,
}: {
  value: number
  format: (v: number) => string
}) {
  const [display, setDisplay] = useState(() => format(0))
  const raf  = useRef<number>(0)
  const prev = useRef(0)

  useEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value) { setDisplay(format(value)); return }

    const dur   = 900
    const start = performance.now()

    function tick(now: number) {
      const p = Math.min((now - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)  // ease-out cubic
      setDisplay(format(from + (value - from) * e))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(format(value))
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return <span>{display}</span>
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface KPIChange {
  /** Percentual sem % — ex: '12.4' */
  value: string
  /** true = subiu */
  up: boolean
  /** Default: 'vs mês anterior' */
  label?: string
}

export interface KPICardProps {
  label: string

  /**
   * Valor numérico → ativa AnimatedNumber.
   * Ou use `valueString` para valor já formatado (sem animação).
   */
  value?: number
  valueString?: string

  color: string
  icon: LucideIcon

  /** Função de formatação para `value` numérico */
  format?: (v: number) => string

  /** Badge percentual de variação */
  change?: KPIChange | null

  /**
   * Inverte lógica do badge: se true, SUBIR é ruim.
   * Use em cards de Despesas.
   */
  invertBadge?: boolean

  /** Texto fixo abaixo do valor quando não há badge */
  sub?: string | null

  /** Href: torna o card clicável */
  href?: string

  glowPos?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-right'

  /** data-tour para o sistema de tour guiado */
  tourId?: string

  className?: string
}

// ─── KPICard ──────────────────────────────────────────────────────────────────
export function KPICard({
  label,
  value,
  valueString,
  color,
  icon: Icon,
  format     = v => v.toLocaleString('pt-BR'),
  change     = null,
  invertBadge = false,
  sub        = null,
  href,
  glowPos    = 'bottom-right',
  tourId,
  className  = '',
}: KPICardProps) {
  const router   = useRouter()
  const isGood   = change ? (invertBadge ? !change.up : change.up) : true
  const bColor   = isGood ? tok.green : tok.red

  const inner = (
    <div className="p-5 relative overflow-hidden" style={{ cursor: href ? 'pointer' : 'default' }}>
      <GlowCorner color={`${color}22`} position={glowPos} />

      {/* Rótulo + ícone */}
      <div className="flex items-center justify-between mb-4" style={{ position: 'relative', zIndex: 1 }}>
        <span
          className="text-xs font-semibold uppercase"
          style={{ color: tok.muted, letterSpacing: '0.1em', fontFamily: SYNE }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}14`,
            border:     `1px solid ${color}25`,
            boxShadow:  `0 0 14px ${color}20`,
          }}
        >
          <Icon size={14} style={{ color }} strokeWidth={2} />
        </div>
      </div>

      {/* Valor */}
      <p
        className="text-2xl font-bold tabular-nums"
        style={{
          fontFamily:    SYNE,
          color,
          textShadow:    `0 0 28px ${color}55`,
          letterSpacing: '-0.01em',
          position:      'relative',
          zIndex:        1,
        }}
      >
        {valueString ?? (
          value !== undefined
            ? <AnimatedNumber value={value} format={format} />
            : '—'
        )}
      </p>

      {/* Badge variação ou sub-texto */}
      <div className="mt-2.5" style={{ position: 'relative', zIndex: 1 }}>
        {change ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-semibold"
              style={{
                background: `${bColor}12`,
                color:      bColor,
                border:     `1px solid ${bColor}25`,
                fontFamily: SYNE,
              }}
            >
              {isGood ? '↑' : '↓'} {change.value}%
            </span>
            <span className="text-xs" style={{ color: tok.muted }}>
              {change.label ?? 'vs mês anterior'}
            </span>
          </div>
        ) : sub ? (
          <p className="text-xs" style={{ color: tok.muted, fontFamily: SYNE }}>{sub}</p>
        ) : null}
      </div>

      {/* Indicador de navegação */}
      {href && (
        <div
          className="flex items-center gap-1 text-xs mt-3 pt-3 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.05)', color, fontWeight: 500 }}
        >
          <ArrowRight size={11} style={{ color }} />
          <span style={{ fontFamily: SYNE }}>Ver detalhes</span>
        </div>
      )}
    </div>
  )

  return (
    <motion.div
      whileHover={href ? { y: -2 } : undefined}
      transition={{ duration: 0.18 }}
    >
      <SpotlightCard
        className={`rounded-2xl h-full ${href ? 'cursor-pointer' : ''} ${className}`}
        spotlightColor={`${color}16`}
        style={card}
        {...(tourId ? { 'data-tour': tourId } as any : {})}
        onClick={href ? () => router.push(href) : undefined}
      >
        {inner}
      </SpotlightCard>
    </motion.div>
  )
}
