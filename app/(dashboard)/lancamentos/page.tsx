'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { ResumoOperador, Periodo } from '@/lib/types'
import {
  BarChart3, Plus, X, Check, RefreshCw, DollarSign,
  TrendingUp, TrendingDown, Wallet, CheckCircle2,
  Download, Calendar, Clock, AlertCircle
} from 'lucide-react'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

function StatusBadge({ comissao, pago }: { comissao: number; pago: number }) {
  const diff = comissao - pago
  if (comissao === 0) return null
  if (diff <= 0) return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:700, background:'rgba(34,197,94,0.1)', color:T.green, border:`1px solid rgba(34,197,94,0.2)` }}><CheckCircle2 size={11}/> Pago</span>
  if (pago > 0) return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:700, background:'rgba(245,158,11,0.1)', color:T.amber, border:`1px solid rgba(245,158,11,0.2)` }}><Clock size={11}/> Parcial — {fmt(diff)} pendente</span>
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:700, background:'rgba(239,68,68,0.1)', color:T.red, border:`1px solid rgba(239,68,68,0.2)` }}><AlertCircle size={11}/> Pendente</span>
}

export default function RelatorioPage() {
  const { user, isOwner } = useOpContext()
  const [periodos,   setPeriodos]   = useState<Periodo[]>([])
  const [resumo,     setResumo]     = useState<ResumoOperador[]>([])
  const [custos,     setCustos]     = useState<number>(0)
  const [pagoMap,    setPagoMap]    = useState<Record<string,number>>({})
  const [loading,    setLoading]    = useState(true)
  const [modalPer,   setModalPer]   = useState(false)
  const [modalPag,   setModalPag]   = useState<string | null>(null)
  const [formPer,    setFormPer]    = useState({ nome:'', data_inicio:'', data_fim:'' })
  const [formPag,    setFormPag]    = useState({ valor_pago:'', observacao:'' })
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    if (!user || !isOwner) return
    setLoading(true)
    const [{ data: perList }, { data: res }, { data: cus }, { data: pags }] = await Promise.all([
      supabase.from('periodos').select('*').eq('owner_id', user.id).order('data_inicio', { ascending: false }),
      supabase.from('resumo_operadores').select('*').eq('owner_id', user.id),
      supabase.from('custos_op').select('valor').eq('owner_id', user.id),
      supabase.from('pagamentos_comissao').select('operador_id, valor_pago').eq('owner_id', user.id),
    ])
    setPeriodos(perList || [])
    setResumo(res || [])
    setCustos((cus || []).reduce((s: number, c: any) => s + c.valor, 0))
    const pm: Record<string,number> = {}
    ;(pags || []).forEach((p: any) => { pm[p.operador_id] = (pm[p.operador_id] || 0) + p.valor_pago })
    setPagoMap(pm)
    setLoading(false)
  }, [user, isOwner])

  useEffect(() => { load() }, [load])

  function exportCSV() {
    const rows = [
      ['Operador','%','Investido Ads','Receita','Lucro Operador','Comissão Devida','Total Pago','Saldo'],
      ...resumo.map(op => {
        const pago = pagoMap[op.operador_id] || 0
        return [op.nome, op.percentual+'%', op.total_ads, op.total_receita, op.lucro_operador, op.comissao_devida, pago, op.comissao_devida - pago]
      }),
      [],
      ['Total','',totalAds,totalReceita,'',totalComissao,totalPago,saldoDevedor],
      ['Custos Op','','','','','',custos,''],
      ['Meu Lucro','','','','','',meuLucro,''],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `relatorio-tiktok-op-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  async function savePeriodo() {
    if (!formPer.nome || !formPer.data_inicio || !formPer.data_fim) return
    setSaving(true)
    await supabase.from('periodos').insert({ ...formPer, owner_id: user.id })
    setSaving(false); setModalPer(false)
    setFormPer({ nome:'', data_inicio:'', data_fim:'' }); load()
  }

  async function registrarPagamento() {
    if (!modalPag || !formPag.valor_pago) return
    const op = resumo.find(r => r.operador_id === modalPag)
    if (!op) return
    setSaving(true)
    const pago = pagoMap[modalPag] || 0
    await supabase.from('pagamentos_comissao').insert({
      owner_id: user.id, operador_id: modalPag,
      valor_pago: parseFloat(formPag.valor_pago),
      valor_devido: op.comissao_devida,
      data_pagamento: new Date().toISOString().slice(0,10),
      status: parseFloat(formPag.valor_pago) >= (op.comissao_devida - pago) ? 'pago' : 'parcial',
      observacao: formPag.observacao || null,
    })
    setSaving(false); setModalPag(null)
    setFormPag({ valor_pago:'', observacao:'' }); load()
  }

  const totalComissao = resumo.reduce((s, r) => s + r.comissao_devida, 0)
  const totalAds      = resumo.reduce((s, r) => s + r.total_ads, 0)
  const totalReceita  = resumo.reduce((s, r) => s + r.total_receita, 0)
  const totalPago     = Object.values(pagoMap).reduce((s, v) => s + v, 0)
  const saldoDevedor  = totalComissao - totalPago
  const meuLucro      = totalComissao - custos

  if (!isOwner) return <div style={{ textAlign:'center', paddingTop:80, color:T.sub, fontFamily:SANS }}>Acesso restrito ao dono da op.</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingBottom:14, borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <h1 style={{ fontFamily:SANS, fontSize:20, fontWeight:700, color:T.text, letterSpacing:'-0.03em', margin:0 }}>Relatório</h1>
          <p style={{ fontFamily:SANS, fontSize:12, color:T.muted, marginTop:3 }}>Consolidado da operação e comissões</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCSV} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color:T.sub, fontFamily:SANS, fontSize:12, cursor:'pointer', transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.sub}>
            <Download size={13} /> Exportar CSV
          </button>
          <button onClick={() => setModalPer(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color:T.sub, fontFamily:SANS, fontSize:12, cursor:'pointer' }}>
            <Calendar size={13} /> Novo Período
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
          <RefreshCw size={18} color={T.muted} style={{ animation:'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10 }}>
            {[
              { label:'Total Ads',       value:totalAds,      color:T.amber,  icon:TrendingDown },
              { label:'Receita',         value:totalReceita,  color:T.green,  icon:TrendingUp   },
              { label:'Comissão Total',  value:totalComissao, color:T.blue,   icon:DollarSign   },
              { label:'Já Recebido',     value:totalPago,     color:T.cyan,   icon:CheckCircle2 },
              { label:'Saldo Devedor',   value:saldoDevedor,  color:saldoDevedor > 0 ? T.violet : T.green, icon:Clock },
              { label:'Custos',          value:custos,        color:T.red,    icon:Wallet       },
              { label:'Meu Lucro',       value:meuLucro,      color:meuLucro >= 0 ? T.green : T.red, icon:BarChart3 },
            ].map(({ label, value, color, icon:Icon }, i) => (
              <div key={label} style={{ ...card, borderRadius:radius.lg, padding:'14px 16px', position:'relative', overflow:'hidden', animation:`fadeUp 0.3s ${i*0.04}s ease both`, opacity:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                  <Icon size={12} color={color} strokeWidth={2.5} />
                  <span style={{ fontFamily:SANS, fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>{label}</span>
                </div>
                <div style={{ fontFamily:SANS, fontSize:18, fontWeight:700, color, letterSpacing:'-0.02em' }}>{fmt(value)}</div>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:color, opacity:0.4, borderRadius:'12px 0 0 12px' }} />
              </div>
            ))}
          </div>

          {/* Por operador */}
          <div>
            <h2 style={{ fontFamily:SANS, fontSize:14, fontWeight:600, color:T.text, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
              Comissões por Operador
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {resumo.length === 0 ? (
                <div style={{ ...card, borderRadius:radius.lg, padding:32, textAlign:'center' }}>
                  <p style={{ fontFamily:SANS, fontSize:13, color:T.muted }}>Nenhum operador cadastrado ainda.</p>
                </div>
              ) : resumo.map((op, i) => {
                const pago = pagoMap[op.operador_id] || 0
                const saldo = op.comissao_devida - pago
                const roas = op.total_ads > 0 ? op.total_receita / op.total_ads : 0
                return (
                  <div key={op.operador_id} style={{ ...card, borderRadius:radius.lg, padding:'18px 20px', animation:`fadeUp 0.3s ${i*0.06}s ease both`, opacity:0 }}>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:9, background:'#1E2333', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SANS, fontSize:14, fontWeight:700, color:T.blue }}>
                          {op.nome[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily:SANS, fontSize:14, fontWeight:600, color:T.text }}>{op.nome}</div>
                          <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>{op.percentual}% · ROAS {roas > 0 ? roas.toFixed(2)+'x' : '—'}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <StatusBadge comissao={op.comissao_devida} pago={pago} />
                        {saldo > 0 && (
                          <button onClick={() => { setModalPag(op.operador_id); setFormPag({ valor_pago: saldo.toFixed(2), observacao:'' }) }}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:7, background:`rgba(34,197,94,0.08)`, border:`1px solid rgba(34,197,94,0.2)`, color:T.green, cursor:'pointer', fontFamily:SANS, fontSize:12, fontWeight:600 }}>
                            <CheckCircle2 size={12}/> Registrar Pagamento
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Grid de números */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 }}>
                      {[
                        { label:'Investiu Ads',    value:op.total_ads,       color:T.amber  },
                        { label:'Faturou',          value:op.total_receita,   color:T.green  },
                        { label:'Lucro Dele',       value:op.lucro_operador,  color:op.lucro_operador >= 0 ? T.cyan : T.red },
                        { label:'Comissão Devida',  value:op.comissao_devida, color:T.blue   },
                        { label:'Saldo a Pagar',    value:saldo,              color:saldo > 0 ? T.violet : T.green },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ background:'rgba(255,255,255,0.025)', borderRadius:8, padding:'10px 12px' }}>
                          <div style={{ fontFamily:SANS, fontSize:10, color:T.muted, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                          <div style={{ fontFamily:SANS, fontSize:14, fontWeight:700, color }}>{fmt(value)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progresso de pagamento */}
                    {op.comissao_devida > 0 && (
                      <div style={{ marginTop:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontFamily:SANS, fontSize:10, color:T.muted }}>Pagamento recebido</span>
                          <span style={{ fontFamily:SANS, fontSize:10, fontWeight:700, color: pago >= op.comissao_devida ? T.green : T.sub }}>
                            {fmt(pago)} / {fmt(op.comissao_devida)}
                          </span>
                        </div>
                        <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:99 }}>
                          <div style={{ height:'100%', width:`${Math.min((pago/op.comissao_devida)*100,100)}%`, background: pago >= op.comissao_devida ? T.green : T.blue, borderRadius:99, transition:'width 0.5s ease' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Períodos */}
          {periodos.length > 0 && (
            <div>
              <h2 style={{ fontFamily:SANS, fontSize:14, fontWeight:600, color:T.text, margin:'0 0 12px', letterSpacing:'-0.01em' }}>Períodos</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {periodos.map(p => (
                  <div key={p.id} style={{ ...card, borderRadius:radius.md, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Calendar size={14} color={T.muted} />
                      <div>
                        <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>{p.nome}</div>
                        <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>{fmtDate(p.data_inicio)} → {fmtDate(p.data_fim)}</div>
                      </div>
                    </div>
                    {p.fechado && <span style={{ fontFamily:SANS, fontSize:10, fontWeight:600, color:T.muted, background:'rgba(255,255,255,0.05)', padding:'2px 8px', borderRadius:5 }}>Fechado</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Período */}
      {modalPer && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ ...cardDeep, borderRadius:radius.lg, padding:28, width:'100%', maxWidth:400 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <h3 style={{ fontFamily:SANS, fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Novo Período</h3>
              <button onClick={() => setModalPer(false)} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted }}><X size={17}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Nome *</label>
                <input value={formPer.nome} onChange={e => setFormPer(f => ({ ...f, nome:e.target.value }))} placeholder="Ex: Maio/2026 — Semana 1" style={inp} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Início *</label>
                  <input value={formPer.data_inicio} onChange={e => setFormPer(f => ({ ...f, data_inicio:e.target.value }))} type="date" style={inp} />
                </div>
                <div>
                  <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Fim *</label>
                  <input value={formPer.data_fim} onChange={e => setFormPer(f => ({ ...f, data_fim:e.target.value }))} type="date" style={inp} />
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button onClick={() => setModalPer(false)} style={{ ...btnGhost, flex:1, padding:'10px 0', borderRadius:8, fontFamily:SANS, fontSize:13 }}>Cancelar</button>
              <button onClick={savePeriodo} disabled={saving || !formPer.nome} style={{ ...btnPrimary, flex:2, padding:'10px 0', borderRadius:8, fontFamily:SANS, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:7, opacity:saving||!formPer.nome?0.5:1 }}>
                <Check size={13}/> {saving ? 'Salvando…' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento */}
      {modalPag && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ ...cardDeep, borderRadius:radius.lg, padding:28, width:'100%', maxWidth:360 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <h3 style={{ fontFamily:SANS, fontSize:15, fontWeight:700, color:T.green, margin:0 }}>Registrar Pagamento</h3>
              <button onClick={() => setModalPag(null)} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted }}><X size={17}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:8, padding:'10px 13px' }}>
                <div style={{ fontFamily:SANS, fontSize:11, color:T.muted, marginBottom:3 }}>Saldo pendente</div>
                <div style={{ fontFamily:SANS, fontSize:16, fontWeight:700, color:T.green }}>
                  {fmt((resumo.find(r => r.operador_id === modalPag)?.comissao_devida || 0) - (pagoMap[modalPag] || 0))}
                </div>
              </div>
              <div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Valor recebido (R$) *</label>
                <input value={formPag.valor_pago} onChange={e => setFormPag(f => ({ ...f, valor_pago:e.target.value }))} type="number" min={0} step={0.01} style={inp} />
              </div>
              <div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Observação</label>
                <input value={formPag.observacao} onChange={e => setFormPag(f => ({ ...f, observacao:e.target.value }))} placeholder="Ex: PIX 03/05" style={inp} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button onClick={() => setModalPag(null)} style={{ ...btnGhost, flex:1, padding:'10px 0', borderRadius:8, fontFamily:SANS, fontSize:13 }}>Cancelar</button>
              <button onClick={registrarPagamento} disabled={saving||!formPag.valor_pago} style={{ flex:2, padding:'10px 0', borderRadius:8, border:'none', cursor:'pointer', background:`rgba(34,197,94,0.15)`, color:T.green, fontFamily:SANS, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7, opacity:saving||!formPag.valor_pago?0.5:1 }}>
                <Check size={13}/> {saving ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
