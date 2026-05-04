'use client'

import { usePathname, useRouter } from 'next/navigation'
import { T, SANS } from '@/lib/design'
import {
  LayoutDashboard, Users, TrendingUp, DollarSign,
  BarChart3, LogOut, Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useOpContext } from '@/lib/op-context'

const supabase = createClient()

const OWNER_NAV = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/operadores',  label: 'Operadores',  icon: Users           },
  { href: '/lancamentos', label: 'Lançamentos', icon: TrendingUp      },
  { href: '/custos',      label: 'Meus Custos', icon: DollarSign      },
  { href: '/relatorio',   label: 'Relatório',   icon: BarChart3       },
]

const OPERADOR_NAV = [
  { href: '/dashboard',   label: 'Painel',       icon: LayoutDashboard },
  { href: '/lancamentos', label: 'Lançamentos',  icon: TrendingUp      },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { isOwner } = useOpContext()
  const nav = isOwner ? OWNER_NAV : OPERADOR_NAV

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div style={{
      width: 220,
      height: '100vh',
      background: '#090B10',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: '#3B82F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={15} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>
            TikTok Op
          </div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: T.muted, letterSpacing: '0.03em', textTransform: 'uppercase', fontWeight: 500 }}>
            {isOwner ? 'Admin' : 'Operador'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, padding: '6px 10px 8px' }}>
          Menu
        </div>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <button
              key={href}
              onClick={() => { router.push(href); onClose?.() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 7, border: 'none',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                background: active ? 'rgba(59,130,246,0.10)' : 'transparent',
                color: active ? '#3B82F6' : T.sub,
                transition: 'all 0.12s',
                fontFamily: SANS,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>
                {label}
              </span>
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%',
                  background: '#3B82F6', flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 7, border: 'none',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            background: 'transparent', color: T.muted, fontFamily: SANS,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.sub; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={15} strokeWidth={2} />
          <span style={{ fontSize: 13 }}>Sair</span>
        </button>
      </div>
    </div>
  )
}
