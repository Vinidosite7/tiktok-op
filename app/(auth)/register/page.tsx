'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Eye, EyeOff, Zap, Mail, CheckCircle } from 'lucide-react'

const SANS = '"IBM Plex Sans", system-ui, sans-serif'

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [focused,   setFocused]   = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4
  const strengthColor = ['transparent', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6'][strength]
  const strengthLabel = ['', 'Fraca', 'Regular', 'Boa', 'Forte'][strength]

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError('Erro ao criar conta. Tente novamente.'); setLoading(false); return }
    if (data.session) { router.push('/dashboard') } else { setEmailSent(true); setLoading(false) }
  }

  const inpStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '10px 13px', borderRadius: 8, fontSize: 13,
    outline: 'none', fontFamily: SANS, background: '#0C0E14',
    border: `1px solid ${focused === field ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
    color: '#F0F2F7',
    boxShadow: focused === field ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  if (emailSent) return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0C0E14', fontFamily: SANS, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, animation: 'fadeUp 0.4s ease both' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={24} color="#3B82F6" strokeWidth={1.5} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.03em', marginBottom: 8 }}>Confirme seu e-mail</h2>
            <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
              Enviamos um link para <span style={{ color: '#3B82F6', fontWeight: 500 }}>{email}</span>. Clique nele para ativar sua conta.
            </p>
          </div>
          <div style={{ width: '100%', background: '#13161F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: '1', text: 'Abra seu e-mail', done: true },
              { n: '2', text: 'Clique em "Confirmar email"', done: false },
              { n: '3', text: 'Você será redirecionado ao app', done: false },
            ].map(({ n, text, done }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  background: done ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.08)',
                  border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.15)'}`,
                  color: done ? '#22C55E' : '#3B82F6' }}>
                  {done ? <CheckCircle size={12} /> : n}
                </div>
                <span style={{ fontSize: 12, color: done ? '#4B5563' : '#374151' }}>{text}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#374151' }}>
            Não recebeu?{' '}
            <button onClick={() => setEmailSent(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', fontSize: 12, fontWeight: 600, padding: 0, fontFamily: SANS }}>
              Tentar outro e-mail
            </button>
          </p>
          <Link href="/login" style={{ fontSize: 12, color: '#374151', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#3B82F6'}
            onMouseLeave={e => e.currentTarget.style.color = '#374151'}>
            ← Voltar para o login
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{`
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0C0E14 inset !important;
          -webkit-text-fill-color: #F0F2F7 !important;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reg-left { display: none; }
        @media (min-width: 768px) { .reg-left { display: flex !important; } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0C0E14', fontFamily: SANS }}>

        {/* ── Esquerda ── */}
        <div className="reg-left" style={{
          width: '40%', background: '#090B10',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          flexDirection: 'column', justifyContent: 'center',
          padding: '48px 52px', gap: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.01em' }}>TikTok Op</span>
          </div>

          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            <h1 style={{ fontSize: 30, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 12 }}>
              Comece a gerenciar sua operação
            </h1>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, maxWidth: 300 }}>
              Crie sua conta e tenha visibilidade total sobre ads, receita e comissões dos seus operadores.
            </p>
          </div>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              'Dashboard consolidado em tempo real',
              'Controle de comissões automático',
              'Histórico completo por operador',
              'Acesso separado por função',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', animation: `fadeUp 0.5s ${0.1 * (i+1)}s ease both`, opacity: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#4B5563' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Direita — form ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 340, animation: 'fadeUp 0.4s ease both' }}>

            {/* Logo mobile */}
            <div className="reg-left" style={{ display: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }} className="reg-logo-mobile">
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F2F7' }}>TikTok Op</span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.03em', marginBottom: 5 }}>Criar conta</h2>
              <p style={{ fontSize: 12, color: '#374151' }}>Preencha os dados para começar.</p>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Nome</label>
                <input type="text" placeholder="Seu nome" value={name}
                  onChange={e => setName(e.target.value)}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                  style={inpStyle('name')} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  style={inpStyle('email')} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                    style={{ ...inpStyle('password'), paddingRight: 40 }}
                    required minLength={6} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#374151',
                    display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#6B7280'}
                    onMouseLeave={e => e.currentTarget.style.color = '#374151'}>
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 2, borderRadius: 999, transition: 'background 0.3s',
                          background: i <= strength ? strengthColor : 'rgba(255,255,255,0.06)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strengthColor, fontWeight: 500 }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: '9px 13px', borderRadius: 7, fontSize: 12,
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '10px 16px', borderRadius: 8, marginTop: 4,
                background: loading ? 'rgba(59,130,246,0.4)' : '#3B82F6',
                color: 'white', fontWeight: 600, fontSize: 13, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: SANS,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2563EB' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3B82F6' }}>
                {loading
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <><span>Criar conta</span><ArrowRight size={13} /></>}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#374151', marginTop: 20 }}>
              Já tem uma conta?{' '}
              <Link href="/login" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
