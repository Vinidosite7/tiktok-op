'use client'

import { useState, useCallback, useEffect } from 'react'

export type ToastType = 'task' | 'payment' | 'event' | 'info' | 'success' | 'warning'

export type Toast = {
  id: string
  type: ToastType
  title: string
  message: string
  color: string
  href?: string
  duration?: number
}

// ─── Cache diário de toasts já exibidos ────────────────────────────────────
const SHOWN_KEY = 'bossflow_toasts_shown'
const SHOWN_DATE_KEY = 'bossflow_toasts_date'

function getTodayShown(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const date = localStorage.getItem(SHOWN_DATE_KEY)
    const today = new Date().toISOString().split('T')[0]
    if (date !== today) {
      localStorage.setItem(SHOWN_DATE_KEY, today)
      localStorage.setItem(SHOWN_KEY, '[]')
      return []
    }
    return JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]')
  } catch { return [] }
}

function markToastShown(id: string) {
  const shown = getTodayShown()
  if (!shown.includes(id)) {
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, id]))
  }
}

// ─── Singleton pub/sub para disparar toasts de qualquer lugar ──────────────
type Listener = (toast: Toast) => void
const listeners = new Set<Listener>()

export function fireToast(toast: Toast) {
  listeners.forEach(fn => fn(toast))
}

// ─── Hook principal ─────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts(prev => prev.find(t => t.id === toast.id) ? prev : [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration ?? 5500)
    }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, dismiss }
}

// ─── Dispara toasts de boas-vindas (1x por dia por tipo) ───────────────────
export function fireWelcomeToasts(notifications: any[]) {
  if (typeof window === 'undefined') return
  const shown = getTodayShown()
  const unread = notifications.filter(n => !n.read)
  if (unread.length === 0) return

  // Agrupa por tipo para não spammar
  const groups: Record<string, any[]> = {}
  unread.forEach(n => {
    if (!groups[n.type]) groups[n.type] = []
    groups[n.type].push(n)
  })

  // Prioridade: event > task > payment > info
  const order = ['event', 'task', 'payment', 'info']
  const sorted = order
    .filter(t => groups[t])
    .map(t => ({ type: t, items: groups[t] }))

  sorted.forEach(({ type, items }, i) => {
    const toastId = `welcome-${type}-${new Date().toISOString().split('T')[0]}`
    if (shown.includes(toastId)) return
    markToastShown(toastId)

    setTimeout(() => {
      const first = items[0]
      const count = items.length
      fireToast({
        id: toastId,
        type: first.type,
        title: count > 1 ? `${count} ${getPlural(type)}` : first.title,
        message: count > 1 ? `${first.message} e mais ${count - 1}` : first.message,
        color: first.color,
        href: first.href,
        duration: 6000,
      })
    }, 900 + i * 750)
  })
}

function getPlural(type: string) {
  const map: Record<string, string> = {
    task: 'tarefas pendentes',
    payment: 'pagamentos pendentes',
    event: 'eventos hoje',
    info: 'alertas de estoque',
  }
  return map[type] ?? 'notificações'
}
