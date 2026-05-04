'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Eye, EyeOff, Zap, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'

const SANS = '"IBM Plex Sans", system-ui, sans-serif'

const FEATURES = [
  { icon: TrendingUp, text: 'Rastreie ads e receita de cada operador em tempo real' },
  { icon: DollarSign, text: 'Calcule automaticamente sua comissão e lucro líquido' },
  { icon: BarChart3,  text: 'Relatórios consolidados da operação TikTok Ads' },
]

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [focused,  setFocused]  = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou senha incorretos.'); setLoading(false); return }
    router.push('/dashboard')
  }

  const inpStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '10px 13px', borderRadius: 8, fontSize: 13,
    outline: 'none', fontFamily: SANS, background: '#0C0E14',
    border: `1px solid ${focused === field ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
    color: '#F0F2F7',
    boxShadow: focused === field ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  return (
    <>
      <style>{`
        input:-webkit-autofill, input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0C0E14 inset !important;
          -webkit-text-fill-color: #F0F2F7 !important;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-left  { display: none; }
        .auth-logo-mobile { display: flex; }
        @media (min-width: 768px) {
          .auth-left  { display: flex !important; }
          .auth-logo-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0C0E14', fontFamily: SANS }}>

        {/* ── Esquerda — branding ── */}
        <div className="auth-left" style={{
          width: '44%', background: '#090B10',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          flexDirection: 'column', justifyContent: 'space-between',
          padding: '48px 52px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.01em' }}>TikTok Op</span>
          </div>

          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6, marginBottom: 20,
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Gestão de Operação
              </span>
            </div>

            <h1 style={{ fontSize: 34, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 14 }}>
              Controle total da sua op TikTok Ads
            </h1>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, maxWidth: 320 }}>
              Painel unificado para acompanhar investimento, receita e comissões dos seus operadores.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 36 }}>
              {FEATURES.map(({ icon: Icon, text }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, animation: `fadeUp 0.5s ${0.12 * (i+1)}s ease both`, opacity: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
                    background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={13} color="#3B82F6" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#1F2937' }}>© 2026 TikTok Op — Uso interno</div>
        </div>

        {/* ── Direita — form ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 340, animation: 'fadeUp 0.4s ease both' }}>

            {/* Logo mobile */}
            <div className="auth-logo-mobile" style={{ alignItems: 'center', gap: 9, marginBottom: 36 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F2F7' }}>TikTok Op</span>
            </div>

            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F0F2F7', letterSpacing: '-0.03em', marginBottom: 5 }}>
                Acessar painel
              </h2>
              <p style={{ fontSize: 12, color: '#374151' }}>Entre com sua conta para continuar.</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  style={inpStyle('email')} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Senha</label>
                  <Link href="/forgot-password" style={{ fontSize: 11, color: '#374151', textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3B82F6'}
                    onMouseLeave={e => e.currentTarget.style.color = '#374151'}>
                    Esqueceu?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                    style={{ ...inpStyle('password'), paddingRight: 40 }} required />
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
              </div>

              {error && (
                <div style={{
                  padding: '9px 13px', borderRadius: 7, fontSize: 12,
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#FCA5A5',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '10px 16px', borderRadius: 8, marginTop: 6,
                background: loading ? 'rgba(59,130,246,0.4)' : '#3B82F6',
                color: 'white', fontWeight: 600, fontSize: 13, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: SANS,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2563EB' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3B82F6' }}>
                {loading
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <><span>Entrar</span><ArrowRight size={13} /></>}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#374151', marginTop: 22 }}>
              Não tem acesso?{' '}
              <Link href="/register" style={{ color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={e => e.currentTarget.style.color = '#3B82F6'}>
                Solicitar conta
              </Link>
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
