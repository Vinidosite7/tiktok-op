'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useToast, Toast } from '@/hooks/useToast'

const typeIcons: Record<string, string> = {
  task: '📋',
  payment: '💸',
  event: '📅',
  sale: '🛍️',
  info: '📦',
  success: '✅',
  warning: '⚠️',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const router = useRouter()

  function handleClick() {
    onDismiss(toast.id)
    if (toast.href) router.push(toast.href)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 18,
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
        width: '100%',
        background: 'rgba(13,13,22,0.97)',
        border: `1px solid ${toast.color}28`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px ${toast.color}12, inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Glow lateral esquerdo */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${toast.color}80, ${toast.color}20)`,
        borderRadius: '18px 0 0 18px',
      }} />

      {/* Ícone */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          background: `${toast.color}15`,
          border: `1px solid ${toast.color}22`,
          marginLeft: 6,
        }}
      >
        {typeIcons[toast.type] ?? '🔔'}
      </motion.div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12, fontWeight: 700, lineHeight: 1,
          color: toast.color, fontFamily: 'Syne, sans-serif',
          marginBottom: 4,
        }}>
          {toast.title}
        </p>
        <p style={{
          fontSize: 12, lineHeight: 1.5,
          color: '#6b6b8a',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {toast.message}
        </p>
      </div>

      {/* Fechar */}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.85 }}
        onClick={e => { e.stopPropagation(); onDismiss(toast.id) }}
        style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#4a4a6a', cursor: 'pointer',
        }}
      >
        <X size={10} />
      </motion.button>

      {/* Barra de progresso */}
      <motion.div
        style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 2, borderRadius: '0 0 18px 18px',
          background: `linear-gradient(90deg, ${toast.color}, ${toast.color}60)`,
          opacity: 0.5,
        }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration ?? 5500) / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
      }}
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
