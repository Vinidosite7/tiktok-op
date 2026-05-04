'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, DM, SYNE, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { Operador, LancamentoAds, LancamentoReceita, Periodo } from '@/lib/types'
import { TrendingDown, TrendingUp, Plus, Trash2, X, Check, RefreshCw } from 'lucide-react'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

type Tab = 'ads' | 'receita'

const PLATAFORMAS = ['Kiwify', 'Hotmart', 'Monetizze', 'Eduzz', 'Braip', 'Outro']

export default function LancamentosPage() {
  const { user, isOwner, operadorId } = useOpContext()
  const [tab,       setTab]       = useState<Tab>('ads')
  const [ads,       setAds]       = useState<LancamentoAds[]>([])
  const [receitas,  setReceitas]  = useState<LancamentoReceita[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [periodos,  setPeriodos]  = useState<Periodo[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<Tab | null>(null)
  const [saving,    setSaving]    = useState(false)

  const [formAds, setFormAds] = useState({
    operador_id: '', periodo_id: '', valor: '', data: new Date().toISOString().slice(0,10),
    descricao: '', conta_ads: ''
  })
  const [formRec, setFormRec] = useState({
    operador_id: '', periodo_id: '', valor: '', data: new Date().toISOString().slice(0,10),
    produto: '', plataforma: 'Kiwify', descricao: ''
  })

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const ownerFilter = isOwner ? { owner_id: user.id } : null

    const [{ data: adsList }, { data: recList }, { data: opList }, { data: perList }] = await Promise.all([
      isOwner
        ? supabase.from('lancamentos_ads').select('*, operador:operadores(nome)').eq('owner_id', user.id).order('data', { ascending: false }).limit(50)
        : supabase.from('lancamentos_ads').select('*, operador:operadores(nome)').eq('operador_id', operadorId).order('data', { ascending: false }).limit(50),
      isOwner
        ? supabase.from('lancamentos_receita').select('*, operador:operadores(nome)').eq('owner_id', user.id).order('data', { ascending: false }).limit(50)
        : supabase.from('lancamentos_receita').select('*, operador:operadores(nome)').eq('operador_id', operadorId).order('data', { ascending: false }).limit(50),
      isOwner
        ? supabase.from('operadores').select('*').eq('owner_id', user.id).eq('ativo', true)
        : supabase.from('operadores').select('*').eq('id', operadorId),
      supabase.from('periodos').select('*').order('data_inicio', { ascending: false }).limit(10),
    ])

    setAds(adsList || [])
    setReceitas(recList || [])
    setOperadores(opList || [])
    setPeriodos(perList || [])

    // pré-seleciona o operador se for operador logado
    if (!isOwner && operadorId) {
      setFormAds(f => ({ ...f, operador_id: operadorId }))
      setFormRec(f => ({ ...f, operador_id: operadorId }))
    }

    setLoading(false)
  }, [user, isOwner, operadorId])

  useEffect(() => { load() }, [load])

  async function saveAds() {
    if (!formAds.operador_id || !formAds.valor) return
    setSaving(true)
    const op = operadores.find(o => o.id === formAds.operador_id)
    await supabase.from('lancamentos_ads').insert({
      owner_id:    isOwner ? user.id : (op as any)?.owner_id,
      operador_id: formAds.operador_id,
      periodo_id:  formAds.periodo_id || null,
      valor:       parseFloat(formAds.valor),
      data:        formAds.data,
      descricao:   formAds.descricao || null,
      conta_ads:   formAds.conta_ads || null,
    })
    setSaving(false)
    setModal(null)
    load()
  }

  async function saveReceita() {
    if (!formRec.operador_id || !formRec.valor) return
    setSaving(true)
    const op = operadores.find(o => o.id === formRec.operador_id)
    await supabase.from('lancamentos_receita').insert({
      owner_id:    isOwner ? user.id : (op as any)?.owner_id,
      operador_id: formRec.operador_id,
      periodo_id:  formRec.periodo_id || null,
      valor:       parseFloat(formRec.valor),
      data:        formRec.data,
      produto:     formRec.produto || null,
      plataforma:  formRec.plataforma || null,
      descricao:   formRec.descricao || null,
    })
    setSaving(false)
    setModal(null)
    load()
  }

  async function removeAds(id: string) {
    if (!confirm('Remover lançamento?')) return
    await supabase.from('lancamentos_ads').delete().eq('id', id)
    load()
  }

  async function removeReceita(id: string) {
    if (!confirm('Remover lançamento?')) return
    await supabase.from('lancamentos_receita').delete().eq('id', id)
    load()
  }

  const select = {
    ...inp,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8aaa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Lançamentos</h1>
          <p style={{ fontFamily: DM, fontSize: 13, color: T.sub, margin: '4px 0 0' }}>
            Registre investimento em ads e receita
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModal('ads')} style={{
            ...btnGhost, padding: '9px 14px', borderRadius: 9,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: DM, fontSize: 12, fontWeight: 600, color: T.amber,
            borderColor: `${T.amber}30`,
          }}>
            <Plus size={13} /> Ads
          </button>
          <button onClick={() => setModal('receita')} style={{
            ...btnPrimary, padding: '9px 14px', borderRadius: 9,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: DM, fontSize: 12, fontWeight: 600,
          }}>
            <Plus size={13} /> Receita
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['ads', 'receita'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: DM, fontSize: 13, fontWeight: 600,
            background: tab === t ? (t === 'ads' ? `${T.amber}20` : `${T.green}20`) : 'transparent',
            color: tab === t ? (t === 'ads' ? T.amber : T.green) : T.sub,
            transition: 'all 0.15s',
          }}>
            {t === 'ads' ? '📉 Investimento Ads' : '📈 Receita'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <RefreshCw size={20} color={T.sub} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(tab === 'ads' ? ads : receitas).length === 0 ? (
            <div style={{ ...card, borderRadius: radius.lg, padding: 32, textAlign: 'center' }}>
              <p style={{ fontFamily: DM, fontSize: 14, color: T.sub }}>
                Nenhum lançamento de {tab === 'ads' ? 'ads' : 'receita'} ainda.
              </p>
            </div>
          ) : tab === 'ads' ? (
            ads.map(a => (
              <div key={a.id} style={{ ...card, borderRadius: radius.md, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${T.amber}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDown size={16} color={T.amber} />
                  </div>
                  <div>
                    <div style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 700, color: T.amber }}>{fmt(a.valor)}</div>
                    <div style={{ fontFamily: DM, fontSize: 11, color: T.sub }}>
                      {(a as any).operador?.nome || '—'} · {fmtDate(a.data)}
                      {a.conta_ads ? ` · ${a.conta_ads}` : ''}
                      {a.descricao ? ` · ${a.descricao}` : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeAds(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            receitas.map(r => (
              <div key={r.id} style={{ ...card, borderRadius: radius.md, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${T.green}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} color={T.green} />
                  </div>
                  <div>
                    <div style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 700, color: T.green }}>{fmt(r.valor)}</div>
                    <div style={{ fontFamily: DM, fontSize: 11, color: T.sub }}>
                      {(r as any).operador?.nome || '—'} · {fmtDate(r.data)}
                      {r.produto ? ` · ${r.produto}` : ''}
                      {r.plataforma ? ` · ${r.plataforma}` : ''}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeReceita(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Ads */}
      {modal === 'ads' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: T.amber, margin: 0 }}>
                📉 Novo Investimento em Ads
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isOwner && (
                <Field label="Operador *">
                  <select value={formAds.operador_id} onChange={e => setFormAds(f => ({ ...f, operador_id: e.target.value }))} style={select}>
                    <option value="">Selecione…</option>
                    {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Valor investido (R$) *">
                <input value={formAds.valor} onChange={e => setFormAds(f => ({ ...f, valor: e.target.value }))} type="number" min={0} step={0.01} placeholder="0,00" style={inp} />
              </Field>
              <Field label="Data *">
                <input value={formAds.data} onChange={e => setFormAds(f => ({ ...f, data: e.target.value }))} type="date" style={inp} />
              </Field>
              <Field label="Conta de Ads (opcional)">
                <input value={formAds.conta_ads} onChange={e => setFormAds(f => ({ ...f, conta_ads: e.target.value }))} placeholder="Ex: Conta Principal, Conta BM2…" style={inp} />
              </Field>
              <Field label="Descrição (opcional)">
                <input value={formAds.descricao} onChange={e => setFormAds(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Campanha produto X" style={inp} />
              </Field>
              {periodos.length > 0 && (
                <Field label="Período (opcional)">
                  <select value={formAds.periodo_id} onChange={e => setFormAds(f => ({ ...f, periodo_id: e.target.value }))} style={select}>
                    <option value="">Sem período</option>
                    {periodos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </Field>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(null)} style={{ ...btnGhost, flex: 1, padding: '11px 0', borderRadius: 10, fontFamily: DM, fontSize: 13 }}>Cancelar</button>
              <button onClick={saveAds} disabled={saving || !formAds.operador_id || !formAds.valor} style={{
                flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `${T.amber}22`, color: T.amber, fontFamily: DM, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: saving || !formAds.operador_id || !formAds.valor ? 0.5 : 1,
              }}>
                <Check size={14} /> {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Receita */}
      {modal === 'receita' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: T.green, margin: 0 }}>
                📈 Nova Receita
              </h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isOwner && (
                <Field label="Operador *">
                  <select value={formRec.operador_id} onChange={e => setFormRec(f => ({ ...f, operador_id: e.target.value }))} style={select}>
                    <option value="">Selecione…</option>
                    {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Valor (R$) *">
                <input value={formRec.valor} onChange={e => setFormRec(f => ({ ...f, valor: e.target.value }))} type="number" min={0} step={0.01} placeholder="0,00" style={inp} />
              </Field>
              <Field label="Data *">
                <input value={formRec.data} onChange={e => setFormRec(f => ({ ...f, data: e.target.value }))} type="date" style={inp} />
              </Field>
              <Field label="Produto">
                <input value={formRec.produto} onChange={e => setFormRec(f => ({ ...f, produto: e.target.value }))} placeholder="Ex: Ebook Emagrecimento" style={inp} />
              </Field>
              <Field label="Plataforma">
                <select value={formRec.plataforma} onChange={e => setFormRec(f => ({ ...f, plataforma: e.target.value }))} style={select}>
                  {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              {periodos.length > 0 && (
                <Field label="Período (opcional)">
                  <select value={formRec.periodo_id} onChange={e => setFormRec(f => ({ ...f, periodo_id: e.target.value }))} style={select}>
                    <option value="">Sem período</option>
                    {periodos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </Field>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(null)} style={{ ...btnGhost, flex: 1, padding: '11px 0', borderRadius: 10, fontFamily: DM, fontSize: 13 }}>Cancelar</button>
              <button onClick={saveReceita} disabled={saving || !formRec.operador_id || !formRec.valor} style={{
                flex: 2, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: `${T.green}22`, color: T.green, fontFamily: DM, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: saving || !formRec.operador_id || !formRec.valor ? 0.5 : 1,
              }}>
                <Check size={14} /> {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
