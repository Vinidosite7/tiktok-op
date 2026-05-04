// ─────────────────────────────────────────────────────────────────────────────
// components/core — barrel de exports
//
// Import único: import { KPICard, SectionHeader, FilterBar, FormModal, PageBackground } from '@/components/core'
// ─────────────────────────────────────────────────────────────────────────────

export { KPICard }                              from './KPICard'
export type { KPICardProps, KPIChange }         from './KPICard'

export { SectionHeader }                        from './SectionHeader'
export type { SectionHeaderProps, SectionCTA }  from './SectionHeader'

export { FilterBar }                            from './FilterBar'
export type { FilterBarProps, FilterTab }       from './FilterBar'

export { FormModal, ModalSubmitButton }               from './FormModal'
export type { FormModalProps, ModalSubmitButtonProps } from './FormModal'

export { PageBackground }                       from './PageBackground'
