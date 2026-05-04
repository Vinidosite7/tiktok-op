'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, radius } from '@/lib/design'
import { ResumoOperador } from '@/lib/types'
import { TrendingUp, TrendingDown, DollarSign, Users, Wallet, RefreshCw, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtK = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return fmt(v)
}

interface Stats {
  totalAds: number
  totalReceita: number
  totalComissao: number
  totalCustos: number
  meuLucro: number
  operadores: ResumoOperador[]
}

function StatCard({ label, value, sub, color, icon: Icon, trend }: {
  label: string; value: number; sub?: string; color: string; icon: any; trend?: 'up' | 'down' | null
}) {
  return (
    <div style={{
      ...card,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${color}14`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={color} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {fmtK(value)}
        </div>
        {sub && <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginTop: 6 }}>{sub}</div>}
      </div>
      {/* Accent line */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: color, opacity: 0.5, borderRadius: '12px 0 0 12px' }} />
    </div>
  )
}

function OperadorRow({ op, onClick }: { op: ResumoOperador; onClick: () => void }) {
  const roas = op.total_ads > 0 ? (op.total_receita / op.total_ads).toFixed(2) : '—'
  const roas_n = op.total_ads > 0 ? op.total_receita / op.total_ads : 0
  const roas_color = roas_n >= 2 ? T.green : roas_n >= 1 ? T.amber : roas_n > 0 ? T.red : T.muted
  const margem = op.total_receita > 0 ? ((op.lucro_operador / op.total_receita) * 100).toFixed(0) : '0'

  return (
    <div
      onClick={onClick}
      style={{
        ...card,
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 120px 120px 100px 80px 28px',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'border-color 0.12s, background 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'
        e.currentTarget.style.background = '#161B27'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.background = '#13161F'
      }}
    >
      {/* Nome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#1E2333',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: SANS, fontSize: 13, fontWeight: 700, color: '#3B82F6',
          flexShrink: 0,
        }}>
          {op.nome[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.text }}>{op.nome}</div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted }}>{op.percentual}% comissão</div>
        </div>
      </div>
      {/* Ads */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginBottom: 2 }}>Investido</div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.amber }}>{fmtK(op.total_ads)}</div>
      </div>
      {/* Receita */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginBottom: 2 }}>Receita</div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.green }}>{fmtK(op.total_receita)}</div>
      </div>
      {/* ROAS */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginBottom: 2 }}>ROAS</div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: roas_color }}>{roas}x</div>
      </div>
      {/* Me deve */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginBottom: 2 }}>Comissão</div>
        <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>{fmtK(op.comissao_devida)}</div>
      </div>
      <ArrowUpRight size={14} color={T.muted} />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useOpContext()
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: resumo }, { data: custos }] = await Promise.all([
      supabase.from('resumo_operadores').select('*').eq('owner_id', user.id),
      supabase.from('custos_op').select('valor').eq('owner_id', user.id),
    ])
    const ops = resumo || []
    const totalCustos = (custos || []).reduce((s: number, c: any) => s + c.valor, 0)
    const totalComissao = ops.reduce((s, o) => s + o.comissao_devida, 0)
    setStats({
      totalAds:       ops.reduce((s, o) => s + o.total_ads, 0),
      totalReceita:   ops.reduce((s, o) => s + o.total_receita, 0),
      totalComissao,
      totalCustos,
      meuLucro:       totalComissao - totalCustos,
      operadores:     ops,
    })
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
      <RefreshCw size={18} color={T.muted} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!stats) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.03em' }}>
            Dashboard
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 12, color: T.muted, marginTop: 3 }}>
            Operação TikTok Ads — visão consolidada
          </p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 7,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
          color: T.muted, fontFamily: SANS, fontSize: 12, cursor: 'pointer',
        }}>
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      {/* Alerta prejuízo */}
      {stats.meuLucro < 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <AlertTriangle size={14} color={T.red} />
          <span style={{ fontFamily: SANS, fontSize: 12, color: '#FCA5A5' }}>
            Seus custos ({fmt(stats.totalCustos)}) superam a comissão a receber ({fmt(stats.totalComissao)}). Revise os percentuais ou reduza custos.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <StatCard label="Investido em Ads"   value={stats.totalAds}      color={T.amber}  icon={TrendingDown} sub="Total operadores" />
        <StatCard label="Receita Total"       value={stats.totalReceita}  color={T.green}  icon={TrendingUp}   sub="Faturamento bruto" />
        <StatCard label="Comissão a Receber"  value={stats.totalComissao} color='#3B82F6'  icon={DollarSign}   sub="Sua % acumulada" />
        <StatCard label="Custos da Op"        value={stats.totalCustos}   color={T.red}    icon={Wallet}       sub="Ferramentas e sistemas" />
        <StatCard label="Meu Lucro Líquido"   value={stats.meuLucro}      color={stats.meuLucro >= 0 ? T.green : T.red} icon={TrendingUp} sub="Comissão − custos" />
      </div>

      {/* Operadores */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color={T.muted} />
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.text }}>
              Operadores
            </span>
            <span style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 600,
              color: T.muted, background: 'rgba(255,255,255,0.05)',
              padding: '2px 7px', borderRadius: 5,
            }}>
              {stats.operadores.length}
            </span>
          </div>
          <button onClick={() => router.push('/operadores')} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: SANS, fontSize: 12, color: '#3B82F6',
          }}>
            Ver todos <ArrowUpRight size={12} />
          </button>
        </div>

        {stats.operadores.length === 0 ? (
          <div style={{
            ...card, padding: '40px 24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <Users size={28} color={T.muted} strokeWidth={1.5} />
            <div>
              <p style={{ fontFamily: SANS, fontSize: 13, color: T.sub, fontWeight: 500 }}>Nenhum operador cadastrado</p>
              <p style={{ fontFamily: SANS, fontSize: 12, color: T.muted, marginTop: 4 }}>Adicione seus sócios para começar a rastrear a operação</p>
            </div>
            <button
              onClick={() => router.push('/operadores')}
              style={{
                padding: '8px 20px', borderRadius: 7, border: 'none',
                background: '#3B82F6', color: 'white',
                fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cadastrar operador
            </button>
          </div>
        ) : (
          <>
            {/* Header da tabela */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 120px 100px 80px 28px',
              gap: 12, padding: '8px 20px',
              fontFamily: SANS, fontSize: 11, fontWeight: 600,
              color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <span>Operador</span>
              <span>Investido</span>
              <span>Receita</span>
              <span>ROAS</span>
              <span>Comissão</span>
              <span />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.operadores.map(op => (
                <OperadorRow key={op.operador_id} op={op} onClick={() => router.push(`/operadores/${op.operador_id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
