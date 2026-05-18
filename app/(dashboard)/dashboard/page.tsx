'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, radius } from '@/lib/design'
import { ResumoOperador, Periodo } from '@/lib/types'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Wallet,
  RefreshCw, ArrowUpRight, AlertTriangle,
  CheckCircle2, Clock, AlertCircle, Target
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const supabase = createClient()
const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtK = (v: number) => Math.abs(v) >= 1000 ? `R$${(v/1000).toFixed(1)}k` : fmt(v)

interface Stats {
  totalAds: number
  totalReceita: number
  totalComissao: number
  totalCustos: number
  meuLucro: number
  totalPago: number
  saldoDevedor: number
  operadores: (ResumoOperador & { totalPago: number })[]
}

function StatusBadge({ comissao, pago }: { comissao: number; pago: number }) {
  const diff = comissao - pago
  if (comissao === 0) return null
  if (diff <= 0) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700, background:'rgba(34,197,94,0.1)', color:T.green, border:`1px solid rgba(34,197,94,0.2)`, whiteSpace:'nowrap' }}>
      <CheckCircle2 size={10}/> Pago
    </span>
  )
  if (pago > 0) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700, background:'rgba(245,158,11,0.1)', color:T.amber, border:`1px solid rgba(245,158,11,0.2)`, whiteSpace:'nowrap' }}>
      <Clock size={10}/> Parcial
    </span>
  )
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:700, background:'rgba(239,68,68,0.1)', color:T.red, border:`1px solid rgba(239,68,68,0.2)`, whiteSpace:'nowrap' }}>
      <AlertCircle size={10}/> Pendente
    </span>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useOpContext()
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [periodo,  setPeriodo]  = useState<string>('all')
  const [meta,     setMeta]     = useState<number>(0)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: perList }, { data: resumo }, { data: custos }, { data: pagamentos }] = await Promise.all([
      supabase.from('periodos').select('*').eq('owner_id', user.id).order('data_inicio', { ascending: false }),
      supabase.from('resumo_operadores').select('*').eq('owner_id', user.id),
      supabase.from('custos_op').select('valor').eq('owner_id', user.id),
      supabase.from('pagamentos_comissao').select('operador_id, valor_pago').eq('owner_id', user.id),
    ])

    setPeriodos(perList || [])

    const ops = resumo || []
    const totalCustos = (custos || []).reduce((s: number, c: any) => s + c.valor, 0)
    const totalComissao = ops.reduce((s, o) => s + o.comissao_devida, 0)

    // Calcula total pago por operador
    const pagoMap: Record<string, number> = {}
    ;(pagamentos || []).forEach((p: any) => {
      pagoMap[p.operador_id] = (pagoMap[p.operador_id] || 0) + p.valor_pago
    })
    const totalPago = Object.values(pagoMap).reduce((s, v) => s + v, 0)

    const opsComPago = ops.map(o => ({ ...o, totalPago: pagoMap[o.operador_id] || 0 }))

    setStats({
      totalAds:       ops.reduce((s, o) => s + o.total_ads, 0),
      totalReceita:   ops.reduce((s, o) => s + o.total_receita, 0),
      totalComissao,
      totalCustos,
      meuLucro:       totalComissao - totalCustos,
      totalPago,
      saldoDevedor:   totalComissao - totalPago,
      operadores:     opsComPago,
    })
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', paddingTop:100 }}>
      <RefreshCw size={18} color={T.muted} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!stats) return null

  const metaPct = meta > 0 ? Math.min((stats.totalComissao / meta) * 100, 100) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingBottom:14, borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <h1 style={{ fontFamily:SANS, fontSize:20, fontWeight:700, color:T.text, letterSpacing:'-0.03em' }}>Dashboard</h1>
          <p style={{ fontFamily:SANS, fontSize:12, color:T.muted, marginTop:3 }}>Operação TikTok Ads — visão consolidada</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Filtro período */}
          <select value={periodo} onChange={e => setPeriodo(e.target.value)} style={{
            background:'#13161F', border:'1px solid rgba(255,255,255,0.07)',
            color: periodo !== 'all' ? T.blue : T.sub,
            borderRadius:7, padding:'7px 10px', fontFamily:SANS, fontSize:12,
            outline:'none', cursor:'pointer',
          }}>
            <option value="all">Todo o período</option>
            {periodos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button onClick={load} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'7px 12px', borderRadius:7,
            background:'transparent', border:'1px solid rgba(255,255,255,0.07)',
            color:T.muted, fontFamily:SANS, fontSize:12, cursor:'pointer',
          }}>
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>
      </div>

      {/* Alerta prejuízo */}
      {stats.meuLucro < 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 15px', borderRadius:8, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)' }}>
          <AlertTriangle size={14} color={T.red} />
          <span style={{ fontFamily:SANS, fontSize:12, color:'#FCA5A5' }}>
            Seus custos ({fmt(stats.totalCustos)}) superam a comissão a receber ({fmt(stats.totalComissao)}). Revise os percentuais ou reduza custos.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(155px, 1fr))', gap:10 }}>
        {[
          { label:'Investido em Ads',  value:stats.totalAds,       color:T.amber,                                              icon:TrendingDown, sub:'Total operadores'    },
          { label:'Receita Total',      value:stats.totalReceita,   color:T.green,                                              icon:TrendingUp,   sub:'Faturamento bruto'   },
          { label:'Comissão Total',     value:stats.totalComissao,  color:T.blue,                                               icon:DollarSign,   sub:'Sua % acumulada'     },
          { label:'Já Recebido',        value:stats.totalPago,      color:T.cyan,                                               icon:CheckCircle2, sub:'Pagamentos recebidos'},
          { label:'Saldo a Receber',    value:stats.saldoDevedor,   color:stats.saldoDevedor > 0 ? T.violet : T.green,          icon:Clock,        sub:'Comissão − recebido' },
          { label:'Meu Lucro Líquido',  value:stats.meuLucro,       color:stats.meuLucro >= 0 ? T.green : T.red,                icon:TrendingUp,   sub:'Comissão − custos'   },
        ].map(({ label, value, color, icon:Icon, sub }) => (
          <div key={label} style={{ ...card, borderRadius:radius.lg, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontFamily:SANS, fontSize:10, fontWeight:600, color:T.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
              <div style={{ width:26, height:26, borderRadius:6, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={12} color={color} strokeWidth={2.5} />
              </div>
            </div>
            <div style={{ fontFamily:SANS, fontSize:22, fontWeight:700, color, letterSpacing:'-0.03em', lineHeight:1 }}>{fmtK(value)}</div>
            <div style={{ fontFamily:SANS, fontSize:10, color:T.muted, marginTop:6 }}>{sub}</div>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:color, opacity:0.4, borderRadius:'12px 0 0 12px' }} />
          </div>
        ))}
      </div>

      {/* Meta mensal */}
      <div style={{ ...card, borderRadius:radius.lg, padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Target size={14} color={T.muted} />
            <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>Meta de Comissão</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:SANS, fontSize:12, color:T.muted }}>R$</span>
            <input
              type="number" value={meta || ''} placeholder="0"
              onChange={e => setMeta(parseFloat(e.target.value) || 0)}
              style={{ background:'transparent', border:'none', outline:'none', fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text, width:90, textAlign:'right' }}
            />
          </div>
        </div>
        <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${metaPct}%`, background: metaPct >= 100 ? T.green : T.blue, borderRadius:99, transition:'width 0.5s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
          <span style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
            {fmt(stats.totalComissao)} de {meta > 0 ? fmt(meta) : '—'}
          </span>
          <span style={{ fontFamily:SANS, fontSize:11, fontWeight:700, color: metaPct >= 100 ? T.green : T.blue }}>
            {meta > 0 ? `${metaPct.toFixed(0)}%` : 'Defina uma meta'}
          </span>
        </div>
      </div>

      {/* Operadores */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Users size={14} color={T.muted} />
            <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>Operadores</span>
            <span style={{ fontFamily:SANS, fontSize:11, fontWeight:600, color:T.muted, background:'rgba(255,255,255,0.05)', padding:'2px 7px', borderRadius:5 }}>
              {stats.operadores.length}
            </span>
          </div>
          <button onClick={() => router.push('/operadores')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', fontFamily:SANS, fontSize:12, color:T.blue }}>
            Ver todos <ArrowUpRight size={12} />
          </button>
        </div>

        {stats.operadores.length === 0 ? (
          <div style={{ ...card, padding:'36px 24px', borderRadius:radius.lg, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <Users size={28} color={T.muted} strokeWidth={1.5} />
            <p style={{ fontFamily:SANS, fontSize:13, color:T.sub }}>Nenhum operador cadastrado</p>
            <button onClick={() => router.push('/operadores')} style={{ padding:'8px 20px', borderRadius:7, border:'none', background:T.blue, color:'white', fontFamily:SANS, fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Cadastrar operador
            </button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 80px 90px 100px 28px', gap:10, padding:'6px 18px', fontFamily:SANS, fontSize:10, fontWeight:600, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              <span>Operador</span><span>Investido</span><span>Receita</span><span>ROAS</span><span>Comissão</span><span>Status</span><span/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {stats.operadores.map(op => {
                const roas = op.total_ads > 0 ? op.total_receita / op.total_ads : 0
                const roas_color = roas >= 2 ? T.green : roas >= 1 ? T.amber : roas > 0 ? T.red : T.muted
                return (
                  <div key={op.operador_id} onClick={() => router.push(`/operadores/${op.operador_id}`)}
                    style={{ ...card, borderRadius:radius.md, padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 110px 110px 80px 90px 100px 28px', alignItems:'center', gap:10, cursor:'pointer', transition:'border-color 0.12s, background 0.12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(59,130,246,0.25)'; e.currentTarget.style.background='#161B27' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='#13161F' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:7, background:'#1E2333', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SANS, fontSize:12, fontWeight:700, color:T.blue, flexShrink:0 }}>
                        {op.nome[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>{op.nome}</div>
                        <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>{op.percentual}% comissão</div>
                      </div>
                    </div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.amber }}>{fmtK(op.total_ads)}</div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.green }}>{fmtK(op.total_receita)}</div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:700, color:roas_color }}>{roas > 0 ? `${roas.toFixed(2)}x` : '—'}</div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.blue }}>{fmtK(op.comissao_devida)}</div>
                    <StatusBadge comissao={op.comissao_devida} pago={op.totalPago} />
                    <ArrowUpRight size={13} color={T.muted} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
