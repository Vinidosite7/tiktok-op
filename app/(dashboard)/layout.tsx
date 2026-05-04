'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { OpProvider } from '@/lib/op-context'
import { createClient } from '@/lib/supabase'
import { Menu } from 'lucide-react'
import { T } from '@/lib/design'

const supabase = createClient()

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router       = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const checkedRef = useRef(false)

  const checkAuth = useCallback(async () => {
    if (checkedRef.current) return
    checkedRef.current = true
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) { router.replace('/login'); return }
    setAuthChecked(true)
  }, [router])

  useEffect(() => {
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        router.replace('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [checkAuth, router])

  if (!authChecked) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #7c6ef7', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <OpProvider onNoUser={() => router.replace('/login')}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f' }}>

        {/* Sidebar desktop */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Drawer mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.7)' }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 60 }}
              >
                <Sidebar onClose={() => setMobileOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Header mobile */}
          <div className="flex md:hidden" style={{
            padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
            background: T.bgDeep, alignItems: 'center', gap: 12
          }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub }}>
              <Menu size={20} />
            </button>
            <span style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>TikTok Op</span>
          </div>

          <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', background: '#0a0a0f' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </OpProvider>
  )
}
