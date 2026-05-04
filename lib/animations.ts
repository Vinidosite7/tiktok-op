// ─────────────────────────────────────────────────────────────────────────────
// BossFlow Animations — motion presets centralizados
//
// Antes: fadeUp / scaleIn copiados em 10 páginas (com variações sutis)
// Agora: importe daqui — se precisar ajustar, mude num lugar só
//
// Uso: <motion.div {...fadeUp(0.1)}>...</motion.div>
// ─────────────────────────────────────────────────────────────────────────────

// Easing padrão BossFlow — suave com aceleração inicial rápida
const ease = [0.16, 1, 0.3, 1] as const

// ─── fadeUp ───────────────────────────────────────────────────────────────────
// Entrada padrão de cards, seções, conteúdo principal
// Sobe 16px + blur desfoca → foca
export function fadeUp(delay = 0) {
  return {
    initial:    { opacity: 0, y: 16, filter: 'blur(4px)' },
    animate:    { opacity: 1, y: 0,  filter: 'blur(0px)' },
    transition: { duration: 0.45, delay, ease },
  }
}

// ─── scaleIn ──────────────────────────────────────────────────────────────────
// Entrada de cards que "aparecem" sem movimento direcional
// Bom para gráficos, modais, cards laterais
export function scaleIn(delay = 0) {
  return {
    initial:    { opacity: 0, scale: 0.96 },
    animate:    { opacity: 1, scale: 1 },
    transition: { duration: 0.45, delay, ease },
  }
}

// ─── fadeIn ───────────────────────────────────────────────────────────────────
// Fade simples — para overlays, tooltips, badges condicionais
export function fadeIn(delay = 0) {
  return {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    transition: { duration: 0.25, delay },
  }
}

// ─── slideDown ────────────────────────────────────────────────────────────────
// Entrada de dropdowns e menus
export function slideDown(delay = 0) {
  return {
    initial:    { opacity: 0, y: -8, scale: 0.97, filter: 'blur(4px)' },
    animate:    { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' },
    exit:       { opacity: 0, y: -8, scale: 0.97 },
    transition: { duration: 0.16, delay, ease },
  }
}

// ─── slideUp ──────────────────────────────────────────────────────────────────
// Entrada de modais bottom-sheet (mobile)
export function slideUp(delay = 0) {
  return {
    initial:    { opacity: 0, y: 24 },
    animate:    { opacity: 1, y: 0 },
    exit:       { opacity: 0, y: 24 },
    transition: { duration: 0.28, delay, ease },
  }
}

// ─── modalEnter ───────────────────────────────────────────────────────────────
// Entrada de modais centralizados
export function modalEnter() {
  return {
    initial:    { opacity: 0, scale: 0.95, filter: 'blur(6px)' },
    animate:    { opacity: 1, scale: 1,    filter: 'blur(0px)' },
    exit:       { opacity: 0, scale: 0.97 },
    transition: { duration: 0.22, ease },
  }
}

// ─── stagger ──────────────────────────────────────────────────────────────────
// Helper para gerar delay incremental em listas
// Uso: items.map((item, i) => <motion.div {...fadeUp(stagger(i))}>)
export function stagger(index: number, base = 0.08, start = 0) {
  return start + index * base
}
