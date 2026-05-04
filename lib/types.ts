// ============================================================
//  TikTok Op — Types globais
// ============================================================

export interface Operador {
  id: string
  owner_id: string
  user_id?: string | null
  nome: string
  email?: string | null
  percentual: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Periodo {
  id: string
  owner_id: string
  nome: string
  data_inicio: string
  data_fim: string
  fechado: boolean
  created_at: string
}

export interface LancamentoAds {
  id: string
  owner_id: string
  operador_id: string
  periodo_id?: string | null
  valor: number
  data: string
  descricao?: string | null
  conta_ads?: string | null
  created_at: string
  updated_at: string
  operador?: Operador
  periodo?: Periodo
}

export interface LancamentoReceita {
  id: string
  owner_id: string
  operador_id: string
  periodo_id?: string | null
  valor: number
  data: string
  produto?: string | null
  plataforma?: string | null
  descricao?: string | null
  created_at: string
  updated_at: string
  operador?: Operador
  periodo?: Periodo
}

export interface CustoOp {
  id: string
  owner_id: string
  nome: string
  valor: number
  recorrente: boolean
  periodo_id?: string | null
  data: string
  categoria: 'ferramenta' | 'trafego' | 'design' | 'outro'
  descricao?: string | null
  created_at: string
  updated_at: string
  periodo?: Periodo
}

export interface PagamentoComissao {
  id: string
  owner_id: string
  operador_id: string
  periodo_id?: string | null
  valor_pago: number
  valor_devido: number
  data_pagamento: string
  status: 'pago' | 'parcial' | 'pendente'
  observacao?: string | null
  created_at: string
  operador?: Operador
  periodo?: Periodo
}

export interface ResumoOperador {
  operador_id: string
  owner_id: string
  nome: string
  email?: string | null
  percentual: number
  total_ads: number
  total_receita: number
  lucro_operador: number
  comissao_devida: number
}

export interface ResumoPeriodo extends ResumoOperador {
  periodo_id: string
  periodo_nome: string
  data_inicio: string
  data_fim: string
}
