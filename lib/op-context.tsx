'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

interface OpContextValue {
  user: any | null
  loading: boolean
  isOwner: boolean
  operadorId: string | null // se o user logado for um operador
  reload: () => void
}

const OpContext = createContext<OpContextValue>({
  user: null, loading: true, isOwner: false, operadorId: null, reload: () => {}
})

export function useOpContext() {
  return useContext(OpContext)
}

export function OpProvider({ children, onNoUser }: { children: ReactNode; onNoUser: () => void }) {
  const [user,       setUser]       = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [isOwner,    setIsOwner]    = useState(false)
  const [operadorId, setOperadorId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { data: { user: u }, error } = await supabase.auth.getUser()
      if (error || !u) { onNoUser(); return }
      setUser(u)

      // Checa se é um operador vinculado
      const { data: op } = await supabase
        .from('operadores')
        .select('id, owner_id')
        .eq('user_id', u.id)
        .eq('ativo', true)
        .maybeSingle()

      if (op) {
        setIsOwner(false)
        setOperadorId(op.id)
      } else {
        setIsOwner(true)
        setOperadorId(null)
      }
    } catch (err) {
      console.error('[OpContext]', err)
    } finally {
      setLoading(false)
    }
  }, [onNoUser])

  useEffect(() => {
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        onNoUser()
      }
    })
    return () => subscription.unsubscribe()
  }, [load, onNoUser])

  return (
    <OpContext.Provider value={{ user, loading, isOwner, operadorId, reload: load }}>
      {children}
    </OpContext.Provider>
  )
}
