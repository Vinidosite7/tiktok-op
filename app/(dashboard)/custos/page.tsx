'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, DM, SYNE, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { CustoOp } from '@/lib/types'
import { Wallet, Plus, Trash2, X, Check, RefreshCw } from 'lucide-react'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const CATEGORIAS = [
  { value: 'ferramenta', label: '🛠 Ferramenta' },
  { value: 'trafego',    label: '📣 Tráfego'    },
  { value: 'design',     label: '🎨 Design'     },
  { value: 'outro',      label: '📦 Outro'      },
]

const EMPTY = { nome: '', valor: '', recorrente: true, data: new Date().toISOString().slice(0,10), categoria: 'ferramenta', descricao: '' }

export default function CustosPage() {
  const { user, isOwner } = useOpContext()
  const [custos,  setCustos]  = useState<CustoOp[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)

  const total = custos.reduce((s, c) => s + c.valor, 0)

  const load = useCallback(async () => {
    if (!user || !isOwner) return
    setLoading(true)
    const { data } = await supabase
      .from('custos_op')
      .select('*')
      .eq('owner_id', user.id)
      .order('data', { ascending: false })
    setCustos(data || [])
    setLoading(false)
  }, [user, isOwner])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!form.nome || !form.valor) return
    setSaving(true)
    await supabase.from('custos_op').insert({
      owner_id:    user.id,
      nome:        form.nome,
      valor:       parseFloat(form.valor),
      recorrente:  form.recorrente,
      data:        form.data,
      categoria:   form.categoria,
      descricao:   form.descricao || null,
    })
    setSaving(false)
    setModal(false)
    setForm(EMPTY)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Remover custo?')) return
    await supabase.from('custos_op').delete().eq('id', id)
    load()
  }

  const select = { ...inp, paddingRight: 36 }

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
          <h1 style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Meus Custos</h1>
          <p style={{ fontFamily: DM, fontSize: 13, color: T.sub, margin: '4px 0 0' }}>Ferramentas e gastos fixos da op</p>
        </div>
        <button onClick={() => setModal(true)} style={{
          ...btnPrimary, padding: '10px 18px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: DM, fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={15} /> Novo Custo
        </button>
      </div>

      {/* Total */}
      <div style={{ ...card, borderRadius: radius.lg, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wallet size={18} color={T.red} />
          <span style={{ fontFamily: DM, fontSize: 13, color: T.sub }}>Total em custos</span>
        </div>
        <span style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 700, color: T.red }}>{fmt(total)}</span>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <RefreshCw size={20} color={T.sub} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : custos.length === 0 ? (
        <div style={{ ...card, borderRadius: radius.lg, padding: 32, textAlign: 'center' }}>
          <Wallet size={32} color={T.muted} style={{ marginBottom: 10 }} />
          <p style={{ fontFamily: DM, fontSize: 14, color: T.sub }}>Nenhum custo cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {custos.map(c => {
            const cat = CATEGORIAS.find(k => k.value === c.categoria)
            return (
              <div key={c.id} style={{ ...card, borderRadius: radius.md, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${T.red}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {cat?.label.split(' ')[0] || '📦'}
                  </div>
                  <div>
                    <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 600, color: T.text }}>{c.nome}</div>
                    <div style={{ fontFamily: DM, fontSize: 11, color: T.sub }}>
                      {fmtDate(c.data)}
                      {c.recorrente ? ' · Recorrente' : ' · Pontual'}
                      {c.descricao ? ` · ${c.descricao}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontFamily: SYNE, fontSize: 15, fontWeight: 700, color: T.red }}>{fmt(c.valor)}</span>
                  <button onClick={() => remove(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Novo Custo</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Sistema de upload em massa" style={inp} />
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Valor (R$) *</label>
                <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} type="number" min={0} step={0.01} placeholder="0,00" style={inp} />
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={select}>
                  {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Data</label>
                <input value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} type="date" style={inp} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente: e.target.checked }))} id="rec" style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="rec" style={{ fontFamily: DM, fontSize: 13, color: T.sub, cursor: 'pointer' }}>Custo recorrente (mensal)</label>
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Descrição (opcional)</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes do custo" style={inp} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(false)} style={{ ...btnGhost, flex: 1, padding: '11px 0', borderRadius: 10, fontFamily: DM, fontSize: 13 }}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.nome || !form.valor} style={{
                ...btnPrimary, flex: 2, padding: '11px 0', borderRadius: 10,
                fontFamily: DM, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: saving || !form.nome || !form.valor ? 0.5 : 1,
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
