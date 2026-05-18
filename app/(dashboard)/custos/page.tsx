'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'
import { T, SANS, card, cardDeep, radius, inp, btnPrimary, btnGhost } from '@/lib/design'
import { CustoOp } from '@/lib/types'
import { Wallet, Plus, Trash2, X, Check, RefreshCw, Repeat, Zap } from 'lucide-react'

const supabase = createClient()
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const CATEGORIAS = [
  { value:'ferramenta', label:'🛠 Ferramenta', emoji:'🛠' },
  { value:'trafego',    label:'📣 Tráfego',    emoji:'📣' },
  { value:'design',     label:'🎨 Design',     emoji:'🎨' },
  { value:'outro',      label:'📦 Outro',      emoji:'📦' },
]

const EMPTY = { nome:'', valor:'', recorrente:true, data:new Date().toISOString().slice(0,10), categoria:'ferramenta', descricao:'' }

export default function CustosPage() {
  const { user, isOwner } = useOpContext()
  const [custos,  setCustos]  = useState<CustoOp[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)

  const recorrentes = custos.filter(c => c.recorrente)
  const pontuais    = custos.filter(c => !c.recorrente)
  const totalRec    = recorrentes.reduce((s, c) => s + c.valor, 0)
  const totalPont   = pontuais.reduce((s, c) => s + c.valor, 0)
  const total       = totalRec + totalPont

  const load = useCallback(async () => {
    if (!user || !isOwner) return
    setLoading(true)
    const { data } = await supabase.from('custos_op').select('*').eq('owner_id', user.id).order('data', { ascending:false })
    setCustos(data || [])
    setLoading(false)
  }, [user, isOwner])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!form.nome || !form.valor) return
    setSaving(true)
    await supabase.from('custos_op').insert({
      owner_id: user.id, nome: form.nome, valor: parseFloat(form.valor),
      recorrente: form.recorrente, data: form.data,
      categoria: form.categoria, descricao: form.descricao || null,
    })
    setSaving(false); setModal(false); setForm(EMPTY); load()
  }

  async function remove(id: string) {
    if (!confirm('Remover custo?')) return
    await supabase.from('custos_op').delete().eq('id', id); load()
  }

  if (!isOwner) return <div style={{ textAlign:'center', paddingTop:80, color:T.sub, fontFamily:SANS }}>Acesso restrito.</div>

  const CustoRow = ({ c }: { c: CustoOp }) => {
    const cat = CATEGORIAS.find(k => k.value === c.categoria)
    return (
      <div style={{ ...card, borderRadius:radius.md, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:'rgba(239,68,68,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
            {cat?.emoji || '📦'}
          </div>
          <div>
            <div style={{ fontFamily:SANS, fontSize:13, fontWeight:600, color:T.text }}>{c.nome}</div>
            <div style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>
              {fmtDate(c.data)} · {c.recorrente ? 'Mensal' : 'Pontual'}
              {c.descricao ? ` · ${c.descricao}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontFamily:SANS, fontSize:14, fontWeight:700, color:T.red }}>{fmt(c.valor)}</span>
          <button onClick={() => remove(c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted, display:'flex', transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.red}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingBottom:14, borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div>
          <h1 style={{ fontFamily:SANS, fontSize:20, fontWeight:700, color:T.text, letterSpacing:'-0.03em', margin:0 }}>Meus Custos</h1>
          <p style={{ fontFamily:SANS, fontSize:12, color:T.muted, marginTop:3 }}>Ferramentas e gastos da operação</p>
        </div>
        <button onClick={() => setModal(true)} style={{ ...btnPrimary, padding:'9px 16px', borderRadius:9, display:'flex', alignItems:'center', gap:7, fontFamily:SANS, fontSize:13, fontWeight:600 }}>
          <Plus size={14}/> Novo Custo
        </button>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
          <RefreshCw size={18} color={T.muted} style={{ animation:'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
            {[
              { label:'Total Geral',    value:total,     color:T.red,   icon:Wallet },
              { label:'Recorrente/mês', value:totalRec,  color:T.amber, icon:Repeat },
              { label:'Pontuais',       value:totalPont, color:T.muted, icon:Zap    },
            ].map(({ label, value, color, icon:Icon }) => (
              <div key={label} style={{ ...card, borderRadius:radius.lg, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                  <Icon size={13} color={color} strokeWidth={2.5}/>
                  <span style={{ fontFamily:SANS, fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>{label}</span>
                </div>
                <div style={{ fontFamily:SANS, fontSize:20, fontWeight:700, color, letterSpacing:'-0.02em' }}>{fmt(value)}</div>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:color, opacity:0.4, borderRadius:'12px 0 0 12px' }} />
              </div>
            ))}
          </div>

          {/* Recorrentes */}
          {recorrentes.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Repeat size={13} color={T.amber}/>
                <span style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color:T.amber }}>Recorrentes mensais</span>
                <span style={{ fontFamily:SANS, fontSize:11, color:T.muted }}>({fmt(totalRec)}/mês)</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {recorrentes.map(c => <CustoRow key={c.id} c={c}/>)}
              </div>
            </div>
          )}

          {/* Pontuais */}
          {pontuais.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Zap size={13} color={T.muted}/>
                <span style={{ fontFamily:SANS, fontSize:12, fontWeight:600, color:T.sub }}>Pontuais</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {pontuais.map(c => <CustoRow key={c.id} c={c}/>)}
              </div>
            </div>
          )}

          {custos.length === 0 && (
            <div style={{ ...card, borderRadius:radius.lg, padding:36, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <Wallet size={28} color={T.muted} strokeWidth={1.5}/>
              <p style={{ fontFamily:SANS, fontSize:13, color:T.sub }}>Nenhum custo cadastrado ainda.</p>
              <button onClick={() => setModal(true)} style={{ ...btnPrimary, padding:'8px 20px', borderRadius:7, fontFamily:SANS, fontSize:13 }}>Adicionar custo</button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ ...cardDeep, borderRadius:radius.lg, padding:28, width:'100%', maxWidth:400 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <h3 style={{ fontFamily:SANS, fontSize:15, fontWeight:700, color:T.text, margin:0 }}>Novo Custo</h3>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:T.muted }}><X size={17}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome:e.target.value }))} placeholder="Ex: Sistema de upload em massa" style={inp}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Valor (R$) *</label>
                  <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor:e.target.value }))} type="number" min={0} step={0.01} placeholder="0,00" style={inp}/>
                </div>
                <div>
                  <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Data</label>
                  <input value={form.data} onChange={e => setForm(f => ({ ...f, data:e.target.value }))} type="date" style={inp}/>
                </div>
              </div>
              <div>
                <label style={{ fontFamily:SANS, fontSize:12, fontWeight:500, color:T.sub, display:'block', marginBottom:6 }}>Categoria</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {CATEGORIAS.map(cat => (
                    <button key={cat.value} onClick={() => setForm(f => ({ ...f, categoria:cat.value }))} style={{
                      padding:'8px 10px', borderRadius:7, border:`1px solid ${form.categoria === cat.value ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      background: form.categoria === cat.value ? 'rgba(59,130,246,0.08)' : 'transparent',
                      color: form.categoria === cat.value ? T.blue : T.muted,
                      fontFamily:SANS, fontSize:12, cursor:'pointer', transition:'all 0.15s',
                    }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="checkbox" checked={form.recorrente} onChange={e => setForm(f => ({ ...f, recorrente:e.target.checked }))} id="rec" style={{ width:15, height:15, cursor:'pointer', accentColor:T.blue }}/>
                <label htmlFor="rec" style={{ fontFamily:SANS, fontSize:13, color:T.sub, cursor:'pointer' }}>Custo recorrente (mensal)</label>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:22 }}>
              <button onClick={() => setModal(false)} style={{ ...btnGhost, flex:1, padding:'10px 0', borderRadius:8, fontFamily:SANS, fontSize:13 }}>Cancelar</button>
              <button onClick={save} disabled={saving||!form.nome||!form.valor} style={{ ...btnPrimary, flex:2, padding:'10px 0', borderRadius:8, fontFamily:SANS, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7, opacity:saving||!form.nome||!form.valor?0.5:1 }}>
                <Check size={13}/> {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
