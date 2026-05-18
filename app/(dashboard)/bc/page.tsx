'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { Operador } from '@/lib/types'
import { Plus, X, Check, RefreshCw, Loader2, Pencil, Zap } from 'lucide-react'

const supabase = createClient()

type BCStatus = 'nova' | 'em_uso' | 'suspensa' | 'banida'

interface BC {
  id: string
  owner_id: string
  numero: number
  bc_id?: string | null
  nome?: string | null
  status: BCStatus
  operador_id?: string | null
  observacao?: string | null
  created_at: string
  updated_at: string
  operador?: { nome: string } | null
}

const STATUS_CONFIG: Record<BCStatus, { label: string; color: string; bg: string; border: string }> = {
  nova:      { label: 'NOVA',      color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'  },
  em_uso:    { label: 'EM USO',    color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  suspensa:  { label: 'SUSPENSA',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  banida:    { label: 'BANIDA',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  },
}

const EMPTY_FORM = { numero: '', bc_id: '', nome: '', status: 'nova' as BCStatus, operador_id: '', observacao: '' }

function StatusBadge({ status }: { status: BCStatus }) {
  const s = STATUS_CONFIG[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, fontFamily: SANS, letterSpacing: '0.08em', background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

type FilterStatus = BCStatus | 'all'

export default function BCPage() {
  const { user, isOwner } = useOpContext()
  const [bcs,        setBcs]       = useState<BC[]>([])
  const [operadores, setOperadores]= useState<Operador[]>([])
  const [loading,    setLoading]   = useState(true)
  const [filter,     setFilter]    = useState<FilterStatus>('all')
  const [modal,      setModal]     = useState(false)
  const [editId,     setEditId]    = useState<string | null>(null)
  const [form,       setForm]      = useState(EMPTY_FORM)
  const [saving,     setSaving]    = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: bcList }, { data: opList }] = await Promise.all([
      supabase.from('business_centers')
        .select('*, operador:operadores(nome)')
        .eq('owner_id', user.id)
        .order('numero', { ascending: true }),
      supabase.from('operadores').select('id, nome, owner_id, user_id, percentual, ativo, created_at, updated_at').eq('owner_id', user.id).eq('ativo', true),
    ])
    setBcs(bcList || [])
    setOperadores(opList || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  function openNew() {
    // Auto-incrementa número
    const next = bcs.length > 0 ? Math.max(...bcs.map(b => b.numero)) + 1 : 1
    setForm({ ...EMPTY_FORM, numero: String(next) })
    setEditId(null)
    setModal(true)
  }

  function openEdit(bc: BC) {
    setForm({
      numero:      String(bc.numero),
      bc_id:       bc.bc_id || '',
      nome:        bc.nome || '',
      status:      bc.status,
      operador_id: bc.operador_id || '',
      observacao:  bc.observacao || '',
    })
    setEditId(bc.id)
    setModal(true)
  }

  async function save() {
    if (!form.numero) return
    setSaving(true)
    const payload = {
      numero:      parseInt(form.numero),
      bc_id:       form.bc_id || null,
      nome:        form.nome || null,
      status:      form.operador_id ? 'em_uso' : form.status,
      operador_id: form.operador_id || null,
      observacao:  form.observacao || null,
    }
    if (editId) {
      await supabase.from('business_centers').update(payload).eq('id', editId)
    } else {
      await supabase.from('business_centers').insert({ ...payload, owner_id: user.id })
    }
    setSaving(false); setModal(false); load()
  }

  async function remove(id: string) {
    if (!confirm('Remover BC?')) return
    await supabase.from('business_centers').delete().eq('id', id); load()
  }

  async function quickAssign(bc: BC, operadorId: string) {
    await supabase.from('business_centers').update({
      operador_id: operadorId || null,
      status: operadorId ? 'em_uso' : 'nova',
    }).eq('id', bc.id)
    load()
  }

  const filtered = filter === 'all' ? bcs : bcs.filter(b => b.status === filter)

  const counts = {
    nova:     bcs.filter(b => b.status === 'nova').length,
    em_uso:   bcs.filter(b => b.status === 'em_uso').length,
    suspensa: bcs.filter(b => b.status === 'suspensa').length,
    banida:   bcs.filter(b => b.status === 'banida').length,
  }

  const select: React.CSSProperties = { ...inp, paddingRight: 36, appearance: 'none' as const }

  if (!isOwner) return <div style={{ textAlign: 'center', paddingTop: 80, color: T.sub, fontFamily: SANS }}>Acesso restrito.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 14, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <h1 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', margin: 0 }}>Business Centers</h1>
          <p style={{ fontFamily: SANS, fontSize: 12, color: T.muted, marginTop: 3 }}>Gerencie suas BCs do TikTok Ads</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: T.muted, fontFamily: SANS, fontSize: 12, cursor: 'pointer' }}>
            <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
          <button onClick={openNew} style={{ ...btnPrimary, padding: '9px 16px', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 7, fontFamily: SANS, fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> Nova BC
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {(Object.entries(counts) as [BCStatus, number][]).map(([status, count]) => {
          const s = STATUS_CONFIG[status]
          return (
            <button key={status} onClick={() => setFilter(filter === status ? 'all' : status)} style={{
              ...card, borderRadius: radius.lg, padding: '14px 16px',
              cursor: 'pointer', border: filter === status ? `1px solid ${s.border}` : '1px solid rgba(255,255,255,0.06)',
              background: filter === status ? s.bg : '#13161F',
              textAlign: 'left', transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, marginTop: 4 }}>business center{count !== 1 ? 's' : ''}</div>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: s.color, opacity: 0.5, borderRadius: '12px 0 0 12px' }} />
            </button>
          )
        })}
      </div>

      {/* Filtro ativo label */}
      {filter !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SANS, fontSize: 12, color: T.muted }}>Filtrando:</span>
          <StatusBadge status={filter} />
          <button onClick={() => setFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: SANS, fontSize: 12 }}>
            × limpar
          </button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <RefreshCw size={18} color={T.muted} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, borderRadius: radius.lg, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Zap size={28} color={T.muted} strokeWidth={1.5} />
          <div>
            <p style={{ fontFamily: SANS, fontSize: 13, color: T.sub, fontWeight: 500, marginBottom: 4 }}>
              {filter !== 'all' ? `Nenhuma BC com status ${STATUS_CONFIG[filter].label}` : 'Nenhuma BC cadastrada ainda'}
            </p>
            <p style={{ fontFamily: SANS, fontSize: 12, color: T.muted }}>Adicione suas Business Centers do TikTok Ads</p>
          </div>
          {filter === 'all' && (
            <button onClick={openNew} style={{ ...btnPrimary, padding: '8px 20px', borderRadius: 7, fontFamily: SANS, fontSize: 13 }}>
              Cadastrar BC
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Header tabela */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 180px 100px 70px', gap: 12, padding: '6px 18px', fontFamily: SANS, fontSize: 10, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>#</span><span>BC</span><span>Status</span><span>Operador</span><span>BC ID</span><span />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((bc, i) => (
              <div key={bc.id} style={{ ...card, borderRadius: radius.md, padding: '12px 18px', display: 'grid', gridTemplateColumns: '60px 1fr 140px 180px 100px 70px', alignItems: 'center', gap: 12, animation: `fadeUp 0.25s ${i * 0.04}s ease both`, opacity: 0 }}>

                {/* Número */}
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#1E2333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 14, fontWeight: 800, color: T.blue }}>
                  {bc.numero}
                </div>

                {/* Nome/info */}
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.text }}>
                    {bc.nome || `BC ${bc.numero}`}
                  </div>
                  {bc.observacao && (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted }}>{bc.observacao}</div>
                  )}
                </div>

                {/* Status */}
                <StatusBadge status={bc.status} />

                {/* Operador — dropdown rápido */}
                <select
                  value={bc.operador_id || ''}
                  onChange={e => quickAssign(bc, e.target.value)}
                  style={{ ...select, fontSize: 12, padding: '6px 10px', background: bc.operador_id ? 'rgba(59,130,246,0.06)' : 'transparent', color: bc.operador_id ? T.text : T.muted, border: `1px solid ${bc.operador_id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)'}` }}
                >
                  <option value="">— Disponível —</option>
                  {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>

                {/* BC ID */}
                <div style={{ fontFamily: SANS, fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bc.bc_id || '—'}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(bc)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(bc.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.15)', background: 'transparent', cursor: 'pointer', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)' }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>
                {editId ? 'Editar BC' : 'Nova Business Center'}
              </h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={17} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: T.sub, display: 'block', marginBottom: 6 }}>Número *</label>
                  <input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} type="number" min={1} style={inp} />
                </div>
                <div>
                  <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: T.sub, display: 'block', marginBottom: 6 }}>Apelido</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: BC Principal, BC BM2..." style={inp} />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: T.sub, display: 'block', marginBottom: 6 }}>BC ID (TikTok)</label>
                <input value={form.bc_id} onChange={e => setForm(f => ({ ...f, bc_id: e.target.value }))} placeholder="ID da BC no TikTok Ads Manager" style={inp} />
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: T.sub, display: 'block', marginBottom: 6 }}>Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {(Object.entries(STATUS_CONFIG) as [BCStatus, typeof STATUS_CONFIG[BCStatus]][]).map(([s, cfg]) => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))} style={{
                      padding: '8px 4px', borderRadius: 7, border: `1px solid ${form.status === s ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                      background: form.status === s ? cfg.bg : 'transparent',
                      color: form.status === s ? cfg.color : T.muted,
                      fontFamily: SANS, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.04em', transition: 'all 0.15s',
                    }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: T.sub, display: 'block', marginBottom: 6 }}>Operador usando</label>
                <select value={form.operador_id} onChange={e => setForm(f => ({ ...f, operador_id: e.target.value, status: e.target.value ? 'em_uso' : f.status }))} style={select}>
                  <option value="">— Ninguém (disponível) —</option>
                  {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: T.sub, display: 'block', marginBottom: 6 }}>Observação</label>
                <input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: BC quente, evitar veicular produto X..." style={inp} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setModal(false)} style={{ ...btnGhost, flex: 1, padding: '10px 0', borderRadius: 8, fontFamily: SANS, fontSize: 13 }}>Cancelar</button>
              <button onClick={save} disabled={saving || !form.numero} style={{ ...btnPrimary, flex: 2, padding: '10px 0', borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: saving || !form.numero ? 0.5 : 1 }}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={13} /> {editId ? 'Salvar' : 'Cadastrar'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
