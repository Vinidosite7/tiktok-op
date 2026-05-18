'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { Operador, LancamentoAds, LancamentoReceita, PagamentoComissao } from '@/lib/types'
import {
  ArrowLeft, TrendingDown, TrendingUp, DollarSign,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
  X, Check, Loader2
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

const supabase = createClient()
const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtK = (v: number) => Math.abs(v) >= 1000 ? `R$${(v/1000).toFixed(1)}k` : fmt(v)
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

type Tab = 'ads' | 'receita' | 'pagamentos'

function StatusBadge({ pago, devido }: { pago: number; devido: number }) {
  const diff = devido - pago
  if (diff <= 0) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(34,197,94,0.1)', color:T.green, border:`1px solid rgba(34,197,94,0.2)` }}>
      <CheckCircle2 size={11} /> Pago
    </span>
  )
  if (pago > 0) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(245,158,11,0.1)', color:T.amber, border:`1px solid rgba(245,158,11,0.2)` }}>
      <Clock size={11} /> Parcial
    </span>
  )
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 9px', borderRadius:6, fontSize:11, fontWeight:700, background:'rgba(239,68,68,0.1)', color:T.red, border:`1px solid rgba(239,68,68,0.2)` }}>
      <AlertCircle size={11} /> Pendente
    </span>
  )
}

export default function OperadorDetailPage() {
  const router    = useRouter()
  const { id }    = useParams<{ id: string }>()
  const { user, isOwner } = useOpContext()

  const [op,        setOp]        = useState<Operador | null>(null)
  const [ads,       setAds]       = useState<LancamentoAds[]>([])
  const [receitas,  setReceitas]  = useState<LancamentoReceita[]>([])
  const [pagamentos,setPagamentos]= useState<PagamentoComissao[]>([])
  const [tab,       setTab]       = useState<Tab>('ads')
  const [loading,   setLoading]   = useState(true)
  const [modalPag,  setModalPag]  = useState(false)
  const [formPag,   setFormPag]   = useState({ valor_pago: '', observacao: '' })
  const [saving,    setSaving]    = useState(false)

  // Totais calculados
  const totalAds      = ads.reduce((s, a) => s + a.valor, 0)
  const totalReceita  = receitas.reduce((s, r) => s + r.valor, 0)
  const lucro         = totalReceita - totalAds
  const comissaoDevida= op ? totalReceita * op.percentual / 100 : 0
  const totalPago     = pagamentos.reduce((s, p) => s + p.valor_pago, 0)
  const saldoDevedor  = comissaoDevida - totalPago
  const roas          = totalAds > 0 ? totalReceita / totalAds : 0

  const load = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    const [{ data: opData }, { data: adsList }, { data: recList }, { data: pagList }] = await Promise.all([
      supabase.from('operadores').select('*').eq('id', id).single(),
      supabase.from('lancamentos_ads').select('*').eq('operador_id', id).order('data', { ascending: false }),
      supabase.from('lancamentos_receita').select('*').eq('operador_id', id).order('data', { ascending: false }),
      supabase.from('pagamentos_comissao').select('*').eq('operador_id', id).order('created_at', { ascending: false }),
    ])
    setOp(opData)
    setAds(adsList || [])
    setReceitas(recList || [])
    setPagamentos(pagList || [])
    setLoading(false)
  }, [user, id])

  useEffect(() => { load() }, [load])

  async function registrarPagamento() {
    if (!formPag.valor_pago || !op) return
    setSaving(true)
    await supabase.from('pagamentos_comissao').insert({
      owner_id:       user.id,
      operador_id:    id,
      valor_pago:     parseFloat(formPag.valor_pago),
      valor_devido:   comissaoDevida,
      data_pagamento: new Date().toISOString().slice(0, 10),
      status:         parseFloat(formPag.valor_pago) >= saldoDevedor ? 'pago' : 'parcial',
      observacao:     formPag.observacao || null,
    })
    setSaving(false)
    setModalPag(false)
    setFormPag({ valor_pago: '', observacao: '' })
    load()
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', paddingTop:100 }}>
      <RefreshCw size={18} color={T.muted} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!op) return (
    <div style={{ textAlign:'center', paddingTop:80, color:T.sub, fontFamily:SANS }}>
      Operador não encontrado.
    </div>
  )

  const KPIS = [
    { label: 'Investido em Ads',  value: totalAds,      color: T.amber,                                      icon: TrendingDown },
    { label: 'Receita Total',     value: totalReceita,  color: T.green,                                      icon: TrendingUp   },
    { label: 'Lucro do Operador', value: lucro,         color: lucro >= 0 ? T.cyan : T.red,                  icon: TrendingUp   },
    { label: 'ROAS',              value: roas,          color: roas >= 2 ? T.green : roas >= 1 ? T.amber : T.red, icon: TrendingUp, isRoas: true },
    { label: 'Comissão Devida',   value: comissaoDevida,color: T.blue,                                       icon: DollarSign   },
    { label: 'Saldo a Receber',   value: saldoDevedor,  color: saldoDevedor > 0 ? T.violet : T.green,        icon: DollarSign   },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:16, borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/operadores')} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', alignItems:'center', gap:6, fontFamily:SANS, fontSize:13, padding:0 }}
            onMouseEnter={e => e.currentTarget.style.color = T.sub}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}>
            <ArrowLeft size={15} /> Operadores
          </button>
          <span style={{ color:T.dim }}>›</span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'#1E2333', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SANS, fontSize:14, fontWeight:700, color:T.blue }}>
              {op.nome[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:SANS, fontSize:15, fontWeight:700, color:T.text, letterSpacing:'-0.02em' }}>{op.nome}</div>
              <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>{op.percentual}% de comissão{op.email ? ` · ${op.email}` : ''}</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <StatusBadge pago={totalPago} devido={comissaoDevida} />
          {isOwner && saldoDevedor > 0 && (
            <button onClick={() => { setFormPag({ valor_pago: String(saldoDevedor.toFixed(2)), observacao:'' }); setModalPag(true) }} style={{
              ...btnPrimary, padding:'8px 16px', borderRadius:8,
              fontFamily:SANS, fontSize:13, fontWeight:600,
              display:'flex', alignItems:'center', gap:6,
            }}>
              <CheckCircle2 size={13} /> Registrar Pagamento
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
        {KPIS.map(({ label, value, color, icon: Icon, isRoas }) => (
          <div key={label} style={{ ...card, borderRadius:radius.lg, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontFamily:SANS, fontSize:10, fontWeight:600, color:T.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
              <div style={{ width:26, height:26, borderRadius:6, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={12} color={color} strokeWidth={2.5} />
              </div>
            </div>
            <div style={{ fontFamily:SANS, fontSize:20, fontWeight:700, color, letterSpacing:'-0.03em' }}>
              {isRoas ? `${value.toFixed(2)}x` : fmtK(value)}
            </div>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:color, opacity:0.4, borderRadius:'12px 0 0 12px' }} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid rgba(255,255,255,0.06)`, marginBottom:16 }}>
          {([
            { key:'ads',       label:`Ads (${ads.length})`              },
            { key:'receita',   label:`Receita (${receitas.length})`     },
            { key:'pagamentos',label:`Pagamentos (${pagamentos.length})`},
          ] as {key:Tab, label:string}[]).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:'9px 18px', border:'none', cursor:'pointer',
              background:'transparent', fontFamily:SANS, fontSize:13, fontWeight:tab===key ? 600 : 400,
              color: tab===key ? T.text : T.muted,
              borderBottom: tab===key ? `2px solid ${T.blue}` : '2px solid transparent',
              transition:'all 0.15s', marginBottom:-1,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ADS */}
        {tab === 'ads' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {ads.length === 0 ? (
              <div style={{ ...card, borderRadius:radius.lg, padding:32, textAlign:'center' }}>
                <p style={{ fontFamily:SANS, fontSize:13, color:T.muted }}>Nenhum lançamento de ads ainda.</p>
              </div>
            ) : ads.map(a => (
              <div key={a.id} style={{ ...card, borderRadius:radius.md, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${T.amber}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <TrendingDown size={14} color={T.amber} />
                  </div>
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.amber }}>{fmt(a.valor)}</div>
                    <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
                      {fmtDate(a.data)}{a.conta_ads ? ` · ${a.conta_ads}` : ''}{a.descricao ? ` · ${a.descricao}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RECEITA */}
        {tab === 'receita' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {receitas.length === 0 ? (
              <div style={{ ...card, borderRadius:radius.lg, padding:32, textAlign:'center' }}>
                <p style={{ fontFamily:SANS, fontSize:13, color:T.muted }}>Nenhuma receita lançada ainda.</p>
              </div>
            ) : receitas.map(r => (
              <div key={r.id} style={{ ...card, borderRadius:radius.md, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${T.green}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <TrendingUp size={14} color={T.green} />
                  </div>
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.green }}>{fmt(r.valor)}</div>
                    <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
                      {fmtDate(r.data)}{r.produto ? ` · ${r.produto}` : ''}{r.plataforma ? ` · ${r.plataforma}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGAMENTOS */}
        {tab === 'pagamentos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {pagamentos.length === 0 ? (
              <div style={{ ...card, borderRadius:radius.lg, padding:32, textAlign:'center' }}>
                <p style={{ fontFamily:SANS, fontSize:13, color:T.muted }}>Nenhum pagamento registrado ainda.</p>
              </div>
            ) : pagamentos.map(p => (
              <div key={p.id} style={{ ...card, borderRadius:radius.md, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${T.green}12`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <CheckCircle2 size={14} color={T.green} />
                  </div>
                  <div>
                    <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.green }}>{fmt(p.valor_pago)}</div>
                    <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
                      {fmtDate(p.data_pagamento)}{p.observacao ? ` · ${p.observacao}` : ''}
                      {' · '}
                      <span style={{ color: p.status === 'pago' ? T.green : p.status === 'parcial' ? T.amber : T.red }}>
                        {p.status === 'pago' ? 'Pago' : p.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily:SANS, fontSize:11, color:T.muted, textAlign:'right' }}>
                  <div>Devido: {fmt(p.valor_devido)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Pagamento */}
      {modalPag && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ ...cardDeep, borderRadius:radius.lg, padding:28, width:'100%', maxWidth:380 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <h3 style={{ fontFamily:SANS, fontSize:15, fontWeight:700, color:T.green, margin:0 }}>Registrar Pagamento</h3>
              <button onClick={() => setModalPag(false)} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted }}><X size={17} /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ fontFamily:SANS, fontSize:12, color:T.muted, marginBottom:10 }}>
                  Saldo atual: <span style={{ color:T.violet, fontWeight:600 }}>{fmt(saldoDevedor)}</span>
                </div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Valor recebido (R$) *</label>
                <input value={formPag.valor_pago} onChange={e => setFormPag(f => ({ ...f, valor_pago: e.target.value }))} type="number" min={0} step={0.01} style={inp} />
              </div>
              <div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Observação</label>
                <input value={formPag.observacao} onChange={e => setFormPag(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: PIX dia 03/05" style={inp} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button onClick={() => setModalPag(false)} style={{ ...btnGhost, flex:1, padding:'10px 0', borderRadius:8, fontFamily:SANS, fontSize:13 }}>Cancelar</button>
              <button onClick={registrarPagamento} disabled={saving || !formPag.valor_pago} style={{
                ...btnPrimary, flex:2, padding:'10px 0', borderRadius:8,
                fontFamily:SANS, fontSize:13, fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                opacity: saving || !formPag.valor_pago ? 0.5 : 1,
              }}>
                {saving ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <><Check size={13}/> Confirmar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
