'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, DM, SYNE, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { ResumoOperador, Periodo, CustoOp } from '@/lib/types'
import { BarChart3, Plus, X, Check, RefreshCw, DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle2 } from 'lucide-react'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

export default function RelatorioPage() {
  const { user, isOwner } = useOpContext()
  const [periodos,  setPeriodos]  = useState<Periodo[]>([])
  const [selected,  setSelected]  = useState<string>('all')
  const [resumo,    setResumo]    = useState<ResumoOperador[]>([])
  const [custos,    setCustos]    = useState<number>(0)
  const [loading,   setLoading]   = useState(true)
  const [modalPer,  setModalPer]  = useState(false)
  const [modalPag,  setModalPag]  = useState<string | null>(null) // operador_id
  const [formPer,   setFormPer]   = useState({ nome: '', data_inicio: '', data_fim: '' })
  const [formPag,   setFormPag]   = useState({ valor_pago: '', observacao: '' })
  const [saving,    setSaving]    = useState(false)

  const load = useCallback(async () => {
    if (!user || !isOwner) return
    setLoading(true)

    const [{ data: perList }, { data: res }, { data: cus }] = await Promise.all([
      supabase.from('periodos').select('*').eq('owner_id', user.id).order('data_inicio', { ascending: false }),
      supabase.from('resumo_operadores').select('*').eq('owner_id', user.id),
      supabase.from('custos_op').select('valor').eq('owner_id', user.id),
    ])

    setPeriodos(perList || [])
    setResumo(res || [])
    setCustos((cus || []).reduce((s: number, c: any) => s + c.valor, 0))
    setLoading(false)
  }, [user, isOwner])

  useEffect(() => { load() }, [load])

  async function savePeriodo() {
    if (!formPer.nome || !formPer.data_inicio || !formPer.data_fim) return
    setSaving(true)
    await supabase.from('periodos').insert({ ...formPer, owner_id: user.id })
    setSaving(false)
    setModalPer(false)
    setFormPer({ nome: '', data_inicio: '', data_fim: '' })
    load()
  }

  async function registrarPagamento() {
    if (!modalPag || !formPag.valor_pago) return
    const op = resumo.find(r => r.operador_id === modalPag)
    if (!op) return
    setSaving(true)
    await supabase.from('pagamentos_comissao').insert({
      owner_id:       user.id,
      operador_id:    modalPag,
      valor_pago:     parseFloat(formPag.valor_pago),
      valor_devido:   op.comissao_devida,
      data_pagamento: new Date().toISOString().slice(0, 10),
      status:         parseFloat(formPag.valor_pago) >= op.comissao_devida ? 'pago' : 'parcial',
      observacao:     formPag.observacao || null,
    })
    setSaving(false)
    setModalPag(null)
    setFormPag({ valor_pago: '', observacao: '' })
    load()
  }

  const totalComissao = resumo.reduce((s, r) => s + r.comissao_devida, 0)
  const totalAds      = resumo.reduce((s, r) => s + r.total_ads, 0)
  const totalReceita  = resumo.reduce((s, r) => s + r.total_receita, 0)
  const meuLucro      = totalComissao - custos

  if (!isOwner) return (
    <div style={{ textAlign: 'center', paddingTop: 80, color: T.sub, fontFamily: DM }}>
      Acesso restrito ao dono da op.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Relatório</h1>
          <p style={{ fontFamily: DM, fontSize: 13, color: T.sub, margin: '4px 0 0' }}>Consolidado da operação e comissões</p>
        </div>
        <button onClick={() => setModalPer(true)} style={{
          ...btnGhost, padding: '9px 16px', borderRadius: 9,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: DM, fontSize: 12, fontWeight: 600,
        }}>
          <Plus size={13} /> Novo Período
        </button>
      </div>

      {/* KPIs consolidados */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <RefreshCw size={20} color={T.sub} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total Ads', value: totalAds,      color: T.amber,  icon: TrendingDown },
              { label: 'Receita',   value: totalReceita,  color: T.green,  icon: TrendingUp   },
              { label: 'Comissão',  value: totalComissao, color: T.purple, icon: DollarSign   },
              { label: 'Custos',    value: custos,        color: T.red,    icon: Wallet       },
              { label: 'Meu Lucro', value: meuLucro,      color: meuLucro >= 0 ? T.cyan : T.red, icon: BarChart3 },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ ...card, borderRadius: radius.lg, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontFamily: DM, fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 700, color }}>{fmt(value)}</div>
              </div>
            ))}
          </div>

          {/* Por operador */}
          <div>
            <h2 style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 14px' }}>
              Comissões por Operador
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resumo.map(op => (
                <div key={op.operador_id} style={{ ...card, borderRadius: radius.lg, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: SYNE, fontSize: 14, fontWeight: 700, color: 'white',
                      }}>
                        {op.nome[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 600, color: T.text }}>{op.nome}</div>
                        <div style={{ fontFamily: DM, fontSize: 11, color: T.sub }}>{op.percentual}% de comissão</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setModalPag(op.operador_id); setFormPag({ valor_pago: String(op.comissao_devida.toFixed(2)), observacao: '' }) }}
                      style={{
                        background: `${T.green}15`, border: `1px solid ${T.green}30`,
                        color: T.green, borderRadius: 8, padding: '7px 14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: DM, fontSize: 12, fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={13} /> Registrar Pagamento
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Investiu em Ads', value: op.total_ads,       color: T.amber  },
                      { label: 'Faturou',         value: op.total_receita,   color: T.green  },
                      { label: 'Lucro Dele',       value: op.lucro_operador,  color: op.lucro_operador >= 0 ? T.cyan : T.red },
                      { label: 'Me Deve',          value: op.comissao_devida, color: T.purple },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontFamily: DM, fontSize: 10, color: T.muted, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 700, color }}>{fmt(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal Período */}
      {modalPer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Novo Período</h3>
              <button onClick={() => setModalPer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Nome *</label>
                <input value={formPer.nome} onChange={e => setFormPer(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Maio/2026 - Semana 1" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Início *</label>
                  <input value={formPer.data_inicio} onChange={e => setFormPer(f => ({ ...f, data_inicio: e.target.value }))} type="date" style={inp} />
                </div>
                <div>
                  <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Fim *</label>
                  <input value={formPer.data_fim} onChange={e => setFormPer(f => ({ ...f, data_fim: e.target.value }))} type="date" style={inp} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setModalPer(false)} style={{ ...btnGhost, flex: 1, padding: '11px 0', borderRadius: 10, fontFamily: DM, fontSize: 13 }}>Cancelar</button>
              <button onClick={savePeriodo} disabled={saving || !formPer.nome} style={{
                ...btnPrimary, flex: 2, padding: '11px 0', borderRadius: 10,
                fontFamily: DM, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: saving || !formPer.nome ? 0.5 : 1,
              }}>
                <Check size={14} /> {saving ? 'Salvando…' : 'Criar Período'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento */}
      {modalPag && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: T.green, margin: 0 }}>Registrar Pagamento</h3>
              <button onClick={() => setModalPag(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Valor recebido (R$) *</label>
                <input value={formPag.valor_pago} onChange={e => setFormPag(f => ({ ...f, valor_pago: e.target.value }))} type="number" min={0} step={0.01} style={inp} />
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Observação</label>
                <input value={formPag.observacao} onChange={e => setFormPag(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: PIX dia 03/05" style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setModalPag(null)} style={{ ...btnGhost, flex: 1, padding: '11px 0', borderRadius: 10, fontFamily: DM, fontSize: 13 }}>Cancelar</button>
              <button onClick={registrarPagamento} disabled={saving || !formPag.valor_pago} style={{
                flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `${T.green}22`, color: T.green, fontFamily: DM, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: saving || !formPag.valor_pago ? 0.5 : 1,
              }}>
                <Check size={14} /> {saving ? 'Salvando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
