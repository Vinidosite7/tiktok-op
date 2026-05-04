'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, DM, SYNE, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { Operador } from '@/lib/types'
import { Users, Plus, Pencil, Trash2, X, Check, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const EMPTY: Partial<Operador> = { nome: '', email: '', percentual: 0, ativo: true }

export default function OperadoresPage() {
  const router = useRouter()
  const { user, isOwner } = useOpContext()
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState<Partial<Operador>>(EMPTY)
  const [editing,    setEditing]    = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('operadores')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
    setOperadores(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  function openNew() {
    setForm(EMPTY)
    setEditing(null)
    setModal(true)
  }

  function openEdit(op: Operador) {
    setForm({ nome: op.nome, email: op.email, percentual: op.percentual, ativo: op.ativo })
    setEditing(op.id)
    setModal(true)
  }

  async function save() {
    if (!form.nome || form.percentual === undefined) return
    setSaving(true)
    const payload = {
      nome:       form.nome,
      email:      form.email || null,
      percentual: form.percentual,
      ativo:      form.ativo ?? true,
    }
    if (editing) {
      await supabase.from('operadores').update(payload).eq('id', editing)
    } else {
      await supabase.from('operadores').insert({ ...payload, owner_id: user.id })
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Remover operador? Isso vai apagar todos os lançamentos dele.')) return
    await supabase.from('operadores').delete().eq('id', id)
    load()
  }

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
          <h1 style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Operadores</h1>
          <p style={{ fontFamily: DM, fontSize: 13, color: T.sub, margin: '4px 0 0' }}>Seus sócios na operação</p>
        </div>
        <button onClick={openNew} style={{
          ...btnPrimary, padding: '10px 18px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: DM, fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={15} /> Novo Operador
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <RefreshCw size={20} color={T.sub} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : operadores.length === 0 ? (
        <div style={{ ...card, borderRadius: radius.lg, padding: 40, textAlign: 'center' }}>
          <Users size={36} color={T.muted} style={{ marginBottom: 12 }} />
          <p style={{ fontFamily: DM, fontSize: 14, color: T.sub }}>Nenhum operador cadastrado ainda.</p>
          <button onClick={openNew} style={{ ...btnPrimary, padding: '9px 20px', borderRadius: 9, marginTop: 12, fontFamily: DM, fontSize: 13, fontWeight: 600 }}>
            Cadastrar agora
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {operadores.map(op => (
            <div key={op.id} style={{
              ...card, borderRadius: radius.lg, padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              opacity: op.ativo ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => router.push(`/operadores/${op.id}`)}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: 'linear-gradient(135deg, #7c6ef7, #a06ef7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SYNE, fontSize: 15, fontWeight: 700, color: 'white',
                }}>
                  {op.nome[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: SYNE, fontSize: 14, fontWeight: 600, color: T.text }}>{op.nome}</div>
                  <div style={{ fontFamily: DM, fontSize: 12, color: T.sub }}>
                    {op.email || 'Sem email'} · {op.percentual}% comissão
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(op)} style={{ ...btnGhost, padding: '7px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, fontFamily: DM, fontSize: 12 }}>
                  <Pencil size={13} /> Editar
                </button>
                <button onClick={() => remove(op.id)} style={{ ...btnGhost, padding: '7px 10px', borderRadius: 8, color: T.red, borderColor: `${T.red}30` }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: SYNE, fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>
                {editing ? 'Editar Operador' : 'Novo Operador'}
              </h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Nome *</label>
                <input
                  value={form.nome || ''}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: João Silva"
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>Email</label>
                <input
                  value={form.email || ''}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  type="email"
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontFamily: DM, fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>
                  % que ele te repassa do faturamento *
                </label>
                <input
                  value={form.percentual || ''}
                  onChange={e => setForm(f => ({ ...f, percentual: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 30"
                  type="number"
                  min={0} max={100} step={0.5}
                  style={inp}
                />
                <span style={{ fontFamily: DM, fontSize: 11, color: T.muted, marginTop: 4, display: 'block' }}>
                  Se ele faturar R$10.000 e a % for 30%, você recebe R$3.000.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <input
                  type="checkbox"
                  checked={form.ativo ?? true}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                  id="ativo"
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="ativo" style={{ fontFamily: DM, fontSize: 13, color: T.sub, cursor: 'pointer' }}>
                  Operador ativo
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setModal(false)} style={{ ...btnGhost, flex: 1, padding: '11px 0', borderRadius: 10, fontFamily: DM, fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving || !form.nome} style={{
                ...btnPrimary, flex: 2, padding: '11px 0', borderRadius: 10,
                fontFamily: DM, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: saving || !form.nome ? 0.6 : 1,
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
