'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { T, SANS, cardDeep, radius, btnPrimary, btnGhost } from '@/lib/design'

interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  onSubmit?: () => void
  submitLabel?: string
  loading?: boolean
  width?: number
}

export function FormModal({
  open, onClose, title, children,
  onSubmit, submitLabel = 'Salvar', loading, width = 440,
}: FormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 101,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
              pointerEvents: 'none',
            }}
          >
            <div style={{ ...cardDeep, borderRadius: radius.lg, padding: 28, width: '100%', maxWidth: width, pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <h3 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}>
                  <X size={17} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {children}
              </div>
              {onSubmit && (
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button onClick={onClose} style={{ ...btnGhost, flex: 1, padding: '10px 0', borderRadius: 8, fontFamily: SANS, fontSize: 13 }}>
                    Cancelar
                  </button>
                  <button onClick={onSubmit} disabled={loading} style={{
                    ...btnPrimary, flex: 2, padding: '10px 0', borderRadius: 8,
                    fontFamily: SANS, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    opacity: loading ? 0.6 : 1,
                  }}>
                    {submitLabel}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
