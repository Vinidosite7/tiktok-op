-- ============================================================
--  TikTok Ads OP — Schema Supabase
--  Dono: você (owner_id = seu user.id)
--  Operadores: seus sócios (cada um tem acesso só aos dados deles)
-- ============================================================

-- ─── EXTENSÕES ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 1. OPERADORES ───────────────────────────────────────────
-- Cada sócio da operação TikTok Ads
create table if not exists operadores (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null, -- conta do sócio (se tiver acesso)
  nome         text not null,
  email        text,
  percentual   numeric(5,2) not null default 0, -- % que ele te repassa do faturamento dele
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── 2. PERÍODOS ─────────────────────────────────────────────
-- Mês/semana de referência para agrupar lançamentos
create table if not exists periodos (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  nome         text not null,              -- ex: "Maio/2026 - Semana 1"
  data_inicio  date not null,
  data_fim     date not null,
  fechado      boolean not null default false, -- período fechado = não aceita mais lançamentos
  created_at   timestamptz not null default now()
);

-- ─── 3. LANÇAMENTOS DE ADS ───────────────────────────────────
-- Investimento em TikTok Ads de cada operador
create table if not exists lancamentos_ads (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  operador_id   uuid not null references operadores(id) on delete cascade,
  periodo_id    uuid references periodos(id) on delete set null,
  valor         numeric(12,2) not null check (valor >= 0),
  data          date not null default current_date,
  descricao     text,                        -- ex: "campanha produto X"
  conta_ads     text,                        -- ID ou nome da conta no TikTok
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── 4. LANÇAMENTOS DE RECEITA ───────────────────────────────
-- Faturamento/vendas de cada operador
create table if not exists lancamentos_receita (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  operador_id   uuid not null references operadores(id) on delete cascade,
  periodo_id    uuid references periodos(id) on delete set null,
  valor         numeric(12,2) not null check (valor >= 0),
  data          date not null default current_date,
  produto       text,                        -- ex: "Ebook X", "Curso Y"
  plataforma    text,                        -- ex: "Kiwify", "Hotmart", "Monetizze"
  descricao     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── 5. CUSTOS DA OPERAÇÃO ───────────────────────────────────
-- Seus gastos fixos com ferramentas, sistemas, etc.
create table if not exists custos_op (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  nome          text not null,              -- ex: "Sistema de upload em massa"
  valor         numeric(12,2) not null check (valor >= 0),
  recorrente    boolean not null default true, -- mensal?
  periodo_id    uuid references periodos(id) on delete set null,
  data          date not null default current_date,
  categoria     text default 'ferramenta',  -- ferramenta | trafego | design | outro
  descricao     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── 6. PAGAMENTOS DE COMISSÃO ───────────────────────────────
-- Registro quando um operador te pagou a % acordada
create table if not exists pagamentos_comissao (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  operador_id   uuid not null references operadores(id) on delete cascade,
  periodo_id    uuid references periodos(id) on delete set null,
  valor_pago    numeric(12,2) not null check (valor_pago >= 0),
  valor_devido  numeric(12,2) not null check (valor_devido >= 0),
  data_pagamento date not null default current_date,
  status        text not null default 'pago' check (status in ('pago', 'parcial', 'pendente')),
  observacao    text,
  created_at    timestamptz not null default now()
);

-- ============================================================
--  ÍNDICES — performance nas queries mais comuns
-- ============================================================
create index if not exists idx_operadores_owner       on operadores(owner_id);
create index if not exists idx_lancamentos_ads_owner  on lancamentos_ads(owner_id);
create index if not exists idx_lancamentos_ads_op     on lancamentos_ads(operador_id);
create index if not exists idx_lancamentos_ads_data   on lancamentos_ads(data desc);
create index if not exists idx_lancamentos_ads_per    on lancamentos_ads(periodo_id);
create index if not exists idx_lancamentos_rec_owner  on lancamentos_receita(owner_id);
create index if not exists idx_lancamentos_rec_op     on lancamentos_receita(operador_id);
create index if not exists idx_lancamentos_rec_data   on lancamentos_receita(data desc);
create index if not exists idx_lancamentos_rec_per    on lancamentos_receita(periodo_id);
create index if not exists idx_custos_op_owner        on custos_op(owner_id);
create index if not exists idx_periodos_owner         on periodos(owner_id);
create index if not exists idx_pagamentos_owner       on pagamentos_comissao(owner_id);
create index if not exists idx_pagamentos_op          on pagamentos_comissao(operador_id);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================

alter table operadores           enable row level security;
alter table periodos             enable row level security;
alter table lancamentos_ads      enable row level security;
alter table lancamentos_receita  enable row level security;
alter table custos_op            enable row level security;
alter table pagamentos_comissao  enable row level security;

-- ─── OPERADORES ──────────────────────────────────────────────
-- Dono vê todos os operadores dele
create policy "owner_all_operadores" on operadores
  for all using (auth.uid() = owner_id);

-- Operador vê só ele mesmo
create policy "operador_see_self" on operadores
  for select using (auth.uid() = user_id);

-- ─── PERÍODOS ────────────────────────────────────────────────
-- Só o dono gerencia períodos
create policy "owner_all_periodos" on periodos
  for all using (auth.uid() = owner_id);

-- Operador vê os períodos do dono (pra referenciar nos lançamentos)
create policy "operador_see_periodos" on periodos
  for select using (
    exists (
      select 1 from operadores o
      where o.owner_id = periodos.owner_id
        and o.user_id = auth.uid()
    )
  );

-- ─── LANÇAMENTOS ADS ─────────────────────────────────────────
-- Dono vê e gerencia tudo
create policy "owner_all_ads" on lancamentos_ads
  for all using (auth.uid() = owner_id);

-- Operador vê e insere só os próprios lançamentos
create policy "operador_own_ads" on lancamentos_ads
  for all using (
    exists (
      select 1 from operadores o
      where o.id = lancamentos_ads.operador_id
        and o.user_id = auth.uid()
    )
  );

-- ─── LANÇAMENTOS RECEITA ─────────────────────────────────────
-- Dono vê e gerencia tudo
create policy "owner_all_receita" on lancamentos_receita
  for all using (auth.uid() = owner_id);

-- Operador vê e insere só os próprios
create policy "operador_own_receita" on lancamentos_receita
  for all using (
    exists (
      select 1 from operadores o
      where o.id = lancamentos_receita.operador_id
        and o.user_id = auth.uid()
    )
  );

-- ─── CUSTOS OP ───────────────────────────────────────────────
-- Só o dono — operadores nunca veem seus custos
create policy "owner_all_custos" on custos_op
  for all using (auth.uid() = owner_id);

-- ─── PAGAMENTOS COMISSÃO ─────────────────────────────────────
-- Dono vê tudo
create policy "owner_all_pagamentos" on pagamentos_comissao
  for all using (auth.uid() = owner_id);

-- Operador vê só os pagamentos dele
create policy "operador_own_pagamentos" on pagamentos_comissao
  for select using (
    exists (
      select 1 from operadores o
      where o.id = pagamentos_comissao.operador_id
        and o.user_id = auth.uid()
    )
  );

-- ============================================================
--  VIEWS ÚTEIS — calcula os números principais
-- ============================================================

-- Resumo por operador: ads investido, receita, lucro, comissão devida
create or replace view resumo_operadores as
select
  o.id                                              as operador_id,
  o.owner_id,
  o.nome,
  o.email,
  o.percentual,
  coalesce(sum(a.valor), 0)                         as total_ads,
  coalesce(sum(r.valor), 0)                         as total_receita,
  coalesce(sum(r.valor), 0) - coalesce(sum(a.valor), 0) as lucro_operador,
  (coalesce(sum(r.valor), 0) * o.percentual / 100)  as comissao_devida
from operadores o
left join lancamentos_ads     a on a.operador_id = o.id
left join lancamentos_receita r on r.operador_id = o.id
group by o.id, o.owner_id, o.nome, o.email, o.percentual;

-- Resumo por operador + período
create or replace view resumo_por_periodo as
select
  o.id                                              as operador_id,
  o.owner_id,
  o.nome,
  o.percentual,
  p.id                                              as periodo_id,
  p.nome                                            as periodo_nome,
  p.data_inicio,
  p.data_fim,
  coalesce(sum(a.valor), 0)                         as total_ads,
  coalesce(sum(r.valor), 0)                         as total_receita,
  coalesce(sum(r.valor), 0) - coalesce(sum(a.valor), 0) as lucro_operador,
  (coalesce(sum(r.valor), 0) * o.percentual / 100)  as comissao_devida
from periodos p
cross join operadores o
left join lancamentos_ads     a on a.operador_id = o.id and a.periodo_id = p.id
left join lancamentos_receita r on r.operador_id = o.id and r.periodo_id = p.id
where p.owner_id = o.owner_id
group by o.id, o.owner_id, o.nome, o.percentual, p.id, p.nome, p.data_inicio, p.data_fim;

-- ============================================================
--  TRIGGERS — updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_operadores_updated_at
  before update on operadores
  for each row execute function update_updated_at();

create trigger trg_lancamentos_ads_updated_at
  before update on lancamentos_ads
  for each row execute function update_updated_at();

create trigger trg_lancamentos_receita_updated_at
  before update on lancamentos_receita
  for each row execute function update_updated_at();

create trigger trg_custos_op_updated_at
  before update on custos_op
  for each row execute function update_updated_at();
