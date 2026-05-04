'use client'

/**
 * FormModal + ModalSubmitButton
 *
 * Shell visual padrão para todos os modais de formulário.
 * Comportamento: overlay blur + slide-up mobile / scale desktop.
 *
 * NÃO gerencia estado nem lógica de negócio.
 * O formulário, inputs e handlers ficam na página.
 *
 * Exemplos:
 *
 * Criação simples:
 *   <FormModal
 *     open={showModal}
 *     onClose={() => setShowModal(false)}
 *     title="Novo cliente"
 *   >
 *     <form onSubmit={handleSave} className="flex flex-col gap-4">
 *       <input style={inp} placeholder="Nome *" ... />
 *       <input style={inp} placeholder="Email" ... />
 *       <ModalSubmitButton loading={saving}>Criar cliente</ModalSubmitButton>
 *     </form>
 *   </FormModal>
 *
 * Criação ou edição:
 *   <FormModal
 *     open={showModal}
 *     onClose={() => { setShowModal(false); setEditItem(null) }}
 *     title={editItem ? 'Editar lançamento' : 'Novo lançamento'}
 *   >
 *     ...
 *     <ModalSubmitButton loading={saving}>
 *       {editItem ? 'Salvar alterações' : 'Criar lançamento'}
 *     </ModalSubmitButton>
 *   </FormModal>
 *
 * Tamanho médio (mais campos):
 *   <FormModal open={open} onClose={close} title="Nova venda" size="md">
 *     ...
 *   </FormModal>
 *
 * Confirm dialog destrutivo:
 *   <FormModal open={showConfirm} onClose={() => setShowConfirm(false)} title="Excluir produto">
 *     <p style={{ color: T.sub }}>Esta ação não pode ser desfeita.</p>
 *     <div className="flex gap-3 mt-4">
 *       <button onClick={() => setShowConfirm(false)} style={btnGhost}>Cancelar</button>
 *       <ModalSubmitButton loading={deleting} variant="danger" onClick={handleDelete}>
 *         Excluir
 *       </ModalSubmitButton>
 *     </div>
 *   </FormModal>
 */

import { X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShimmerButton } from '@/components/ui/primitives'
import { T, SYNE } from '@/lib/design'

// ─── Tamanhos ─────────────────────────────────────────────────────────────────
const SIZE: Record<string, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

// ─── FormModal ────────────────────────────────────────────────────────────────
export interface FormModalProps {
  open:     boolean
  onClose:  () => void
  title:    string
  children: React.ReactNode
  /** Default: 'sm' (max-w-md) */
  size?:    'sm' | 'md' | 'lg'
}

export function FormModal({ open, onClose, title, children, size = 'sm' }: FormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        // Overlay
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ y: 64, opacity: 0, scale: 0.97 }}
            animate={{ y: 0,  opacity: 1, scale: 1 }}
            exit={{ y: 64,    opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className={`w-full ${SIZE[size]} rounded-t-3xl sm:rounded-2xl p-6`}
            style={{
              background:     T.bgDeep,
              border:         `1px solid ${T.borderP}`,
              boxShadow:      '0 0 0 1px rgba(124,110,247,0.08), 0 -8px 48px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(28px)',
            }}
          >
            {/* Pill handle (mobile only) */}
            <div
              className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-bold text-lg"
                style={{ fontFamily: SYNE, color: T.text }}
              >
                {title}
              </h2>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color:      T.sub,
                  border:     `1px solid ${T.border}`,
                  cursor:     'pointer',
                }}
                aria-label="Fechar"
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Conteúdo da página */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── ModalSubmitButton ────────────────────────────────────────────────────────
export interface ModalSubmitButtonProps {
  loading?:      boolean
  loadingLabel?: string
  disabled?:     boolean
  /** 'primary' (roxo, default) | 'danger' (vermelho) */
  variant?:      'primary' | 'danger'
  /** Para uso como botão não-submit (confirm dialogs) */
  onClick?:      () => void
  children:      React.ReactNode
}

export function ModalSubmitButton({
  loading      = false,
  loadingLabel = 'Salvando...',
  disabled     = false,
  variant      = 'primary',
  onClick,
  children,
}: ModalSubmitButtonProps) {
  const isDisabled = loading || disabled

  const bg = variant === 'danger'
    ? `linear-gradient(135deg, #f87171 0%, #ef4444 100%)`
    : `linear-gradient(135deg, #7c6ef7 0%, #a06ef7 100%)`

  const glow = variant === 'danger'
    ? '0 0 28px rgba(248,113,113,0.35), inset 0 1px 0 rgba(255,255,255,0.12)'
    : '0 0 28px rgba(124,110,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'

  return (
    <ShimmerButton
      type={onClick ? 'button' : 'submit'}
      disabled={isDisabled}
      onClick={onClick}
      className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm w-full"
      style={{
        background: isDisabled ? 'rgba(255,255,255,0.05)' : bg,
        color:      isDisabled ? T.muted : 'white',
        boxShadow:  loading ? 'none' : isDisabled ? 'none' : glow,
        border:     isDisabled ? `1px solid ${T.border}` : '1px solid rgba(255,255,255,0.1)',
        opacity:    loading ? 0.7 : 1,
        cursor:     isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: SYNE,
      }}
    >
      {loading
        ? <><Loader2 size={15} className="animate-spin" /> {loadingLabel}</>
        : children
      }
    </ShimmerButton>
  )
}
