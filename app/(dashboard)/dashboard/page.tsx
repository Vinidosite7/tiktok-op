'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, radius } from '@/lib/design'
import { ResumoOperador, Periodo, LancamentoAds, LancamentoReceita } from '@/lib/types'
import {
  TrendingUp, TrendingDown, DollarSign, Users, Wallet,
  RefreshCw, ArrowUpRight, AlertTriangle,
  CheckCircle2, Clock, AlertCircle, Target, BarChart2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

const supabase = createClient()
const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtK = (v: number) => Math.abs(v) >= 1000 ? `R$${(v/1000).toFixed(1)}k` : fmt(v)

interface Stats {
  totalAds: number; totalReceita: number; totalComissao: number
  totalCustos: number; meuLucro: number; totalPago: number
  saldoDevedor: number; operadores: (ResumoOperador & { totalPago: number })[]
}

function Skeleton({ w = '100%', h = 20 }: { w?: string | number; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)', animation: 'shimmer 1.5s infinite' }} />
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  )
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0F1219', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: p.color, marginBottom: 2 }}>
          {p.name}: {fmtK(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useOpContext()
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [meta,     setMeta]     = useState<number>(0)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: perList }, { data: resumo }, { data: custos }, { data: pagamentos }, { data: allAds }, { data: allRec }] = await Promise.all([
      supabase.from('periodos').select('*').eq('owner_id', user.id).order('data_inicio', { ascending: false }),
      supabase.from('resumo_operadores').select('*').eq('owner_id', user.id),
      supabase.from('custos_op').select('valor').eq('owner_id', user.id),
      supabase.from('pagamentos_comissao').select('operador_id, valor_pago').eq('owner_id', user.id),
      supabase.from('lancamentos_ads').select('valor, data').eq('owner_id', user.id).order('data', { ascending: true }),
      supabase.from('lancamentos_receita').select('valor, data').eq('owner_id', user.id).order('data', { ascending: true }),
    ])

    setPeriodos(perList || [])

    // Chart data agrupado por dia
    const byDate: Record<string, { ads: number; receita: number }> = {}
    ;(allAds || []).forEach((a: any) => {
      const d = a.data.slice(0, 10)
      if (!byDate[d]) byDate[d] = { ads: 0, receita: 0 }
      byDate[d].ads += a.valor
    })
    ;(allRec || []).forEach((r: any) => {
      const d = r.data.slice(0, 10)
      if (!byDate[d]) byDate[d] = { ads: 0, receita: 0 }
      byDate[d].receita += r.valor
    })
    const chart = Object.entries(byDate).slice(-14).map(([date, v]) => ({
      data: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      Receita: v.receita,
      Ads: v.ads,
    }))
    setChartData(chart)

    const ops = resumo || []
    const totalCustos = (custos || []).reduce((s: number, c: any) => s + c.valor, 0)
    const totalComissao = ops.reduce((s, o) => s + o.comissao_devida, 0)
    const pagoMap: Record<string, number> = {}
    ;(pagamentos || []).forEach((p: any) => { pagoMap[p.operador_id] = (pagoMap[p.operador_id] || 0) + p.valor_pago })
    const totalPago = Object.values(pagoMap).reduce((s, v) => s + v, 0)

    setStats({
      totalAds:      ops.reduce((s, o) => s + o.total_ads, 0),
      totalReceita:  ops.reduce((s, o) => s + o.total_receita, 0),
      totalComissao, totalCustos,
      meuLucro:      totalComissao - totalCustos,
      totalPago,
      saldoDevedor:  totalComissao - totalPago,
      operadores:    ops.map(o => ({ ...o, totalPago: pagoMap[o.operador_id] || 0 })),
    })
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const metaPct = meta > 0 && stats ? Math.min((stats.totalComissao / meta) * 100, 100) : 0

  const KPIS = stats ? [
    { label:'Investido em Ads',  value:stats.totalAds,      color:T.amber,                                       icon:TrendingDown },
    { label:'Receita Total',      value:stats.totalReceita,  color:T.green,                                       icon:TrendingUp   },
    { label:'Comissão Total',     value:stats.totalComissao, color:T.blue,                                        icon:DollarSign   },
    { label:'Já Recebido',        value:stats.totalPago,     color:T.cyan,                                        icon:CheckCircle2 },
    { label:'Saldo a Receber',    value:stats.saldoDevedor,  color:stats.saldoDevedor > 0 ? T.violet : T.green,   icon:Clock        },
    { label:'Meu Lucro Líquido',  value:stats.meuLucro,      color:stats.meuLucro >= 0 ? T.green : T.red,         icon:TrendingUp   },
  ] : []

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingBottom:14, borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <h1 style={{ fontFamily:SANS, fontSize:20, fontWeight:700, color:T.text, letterSpacing:'-0.03em', margin:0 }}>Dashboard</h1>
          <p style={{ fontFamily:SANS, fontSize:12, color:T.muted, marginTop:3 }}>Operação TikTok Ads — visão consolidada</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:7, background:'transparent', border:'1px solid rgba(255,255,255,0.07)', color:T.muted, fontFamily:SANS, fontSize:12, cursor:'pointer' }}>
          <RefreshCw size={12} style={loading ? { animation:'spin 1s linear infinite' } : {}} /> Atualizar
        </button>
      </div>

      {/* Alerta */}
      {!loading && stats && stats.meuLucro < 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 15px', borderRadius:8, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', animation:'fadeUp 0.3s ease both' }}>
          <AlertTriangle size={14} color={T.red} />
          <span style={{ fontFamily:SANS, fontSize:12, color:'#FCA5A5' }}>
            Seus custos ({fmt(stats.totalCustos)}) superam a comissão a receber ({fmt(stats.totalComissao)}).
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(155px, 1fr))', gap:10 }}>
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} style={{ ...card, borderRadius:radius.lg, padding:'16px 18px' }}>
            <Skeleton h={10} w="60%" /><div style={{ marginTop:12 }}><Skeleton h={24} w="70%" /></div>
          </div>
        )) : KPIS.map(({ label, value, color, icon:Icon }, i) => (
          <div key={label} style={{ ...card, borderRadius:radius.lg, padding:'16px 18px', position:'relative', overflow:'hidden', animation:`fadeUp 0.3s ${i*0.05}s ease both`, opacity:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontFamily:SANS, fontSize:10, fontWeight:600, color:T.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
              <div style={{ width:26, height:26, borderRadius:6, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={12} color={color} strokeWidth={2.5} />
              </div>
            </div>
            <div style={{ fontFamily:SANS, fontSize:22, fontWeight:700, color, letterSpacing:'-0.03em', lineHeight:1 }}>{fmtK(value)}</div>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:color, opacity:0.4, borderRadius:'12px 0 0 12px' }} />
          </div>
        ))}
      </div>

      {/* Gráfico + Meta */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:12 }}>

        {/* Gráfico */}
        <div style={{ ...card, borderRadius:radius.lg, padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <BarChart2 size={14} color={T.muted} />
            <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>Receita vs Ads — últimos 14 dias</span>
          </div>
          {loading ? <Skeleton h={160} /> : chartData.length === 0 ? (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:SANS, fontSize:12, color:T.muted }}>Sem dados ainda. Lance receita e ads para ver o gráfico.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gAds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.amber} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={T.amber} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="data" tick={{ fontFamily:SANS, fontSize:10, fill:T.muted }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fontFamily:SANS, fontSize:10, fill:T.muted }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Receita" stroke={T.green} strokeWidth={2} fill="url(#gRec)" dot={false} />
                <Area type="monotone" dataKey="Ads" stroke={T.amber} strokeWidth={2} fill="url(#gAds)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div style={{ display:'flex', gap:16, marginTop:12 }}>
            {[{color:T.green, label:'Receita'},{color:T.amber, label:'Ads'}].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:l.color }} />
                <span style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div style={{ ...card, borderRadius:radius.lg, padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Target size={14} color={T.muted} />
            <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>Meta de Comissão</span>
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:16 }}>
            {/* Valor da meta */}
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontFamily:SANS, fontSize:10, color:T.muted, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Meta mensal</div>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontFamily:SANS, fontSize:13, color:T.muted }}>R$</span>
                <input type="number" value={meta || ''} placeholder="0,00"
                  onChange={e => setMeta(parseFloat(e.target.value) || 0)}
                  style={{ background:'transparent', border:'none', outline:'none', fontFamily:SANS, fontSize:20, fontWeight:700, color:T.text, width:'100%' }} />
              </div>
            </div>

            {/* Progress */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>Progresso</span>
                <span style={{ fontFamily:SANS, fontSize:12, fontWeight:700, color: metaPct >= 100 ? T.green : T.blue }}>
                  {meta > 0 ? `${metaPct.toFixed(0)}%` : '—'}
                </span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${metaPct}%`, background: metaPct >= 100 ? T.green : T.blue, borderRadius:99, transition:'width 0.6s ease' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <span style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
                  {loading ? '—' : fmtK(stats?.totalComissao || 0)}
                </span>
                <span style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
                  {meta > 0 ? fmtK(meta) : 'Defina uma meta'}
                </span>
              </div>
            </div>

            {/* Falta */}
            {meta > 0 && stats && stats.totalComissao < meta && (
              <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontFamily:SANS, fontSize:10, color:T.muted, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Falta atingir</div>
                <div style={{ fontFamily:SANS, fontSize:16, fontWeight:700, color:T.blue }}>{fmtK(meta - stats.totalComissao)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operadores */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Users size={14} color={T.muted} />
            <span style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>Operadores</span>
            {!loading && stats && (
              <span style={{ fontFamily:SANS, fontSize:11, fontWeight:600, color:T.muted, background:'rgba(255,255,255,0.05)', padding:'2px 7px', borderRadius:5 }}>
                {stats.operadores.length}
              </span>
            )}
          </div>
          <button onClick={() => router.push('/operadores')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', fontFamily:SANS, fontSize:12, color:T.blue }}>
            Ver todos <ArrowUpRight size={12} />
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {Array(2).fill(0).map((_, i) => (
              <div key={i} style={{ ...card, borderRadius:radius.md, padding:'14px 18px' }}><Skeleton h={40} /></div>
            ))}
          </div>
        ) : !stats || stats.operadores.length === 0 ? (
          <div style={{ ...card, padding:'36px 24px', borderRadius:radius.lg, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <Users size={28} color={T.muted} strokeWidth={1.5} />
            <div>
              <p style={{ fontFamily:SANS, fontSize:13, color:T.sub, fontWeight:500, marginBottom:4 }}>Nenhum operador cadastrado</p>
              <p style={{ fontFamily:SANS, fontSize:12, color:T.muted }}>Adicione seus sócios para começar a rastrear</p>
            </div>
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
              {stats.operadores.map((op, i) => {
                const roas = op.total_ads > 0 ? op.total_receita / op.total_ads : 0
                const roas_color = roas >= 2 ? T.green : roas >= 1 ? T.amber : roas > 0 ? T.red : T.muted
                return (
                  <div key={op.operador_id} onClick={() => router.push(`/operadores/${op.operador_id}`)}
                    style={{ ...card, borderRadius:radius.md, padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 110px 110px 80px 90px 100px 28px', alignItems:'center', gap:10, cursor:'pointer', transition:'border-color 0.12s, background 0.12s', animation:`fadeUp 0.3s ${i*0.06}s ease both`, opacity:0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(59,130,246,0.25)'; e.currentTarget.style.background='#161B27' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='#13161F' }}>
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
