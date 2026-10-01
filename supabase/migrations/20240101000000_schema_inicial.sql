-- ============================================================
-- Schema inicial — Ficha Técnica SaaS
-- ============================================================

-- Habilitar extensão para UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- RESTAURANTES
-- ----------------------------------------------------------------
create table public.restaurantes (
  id              uuid primary key default gen_random_uuid(),
  dono_id         uuid not null references auth.users(id) on delete cascade,
  nome            text not null,
  pct_impostos    numeric(5,4) not null default 0.06,
  pct_taxa_cartao numeric(5,4) not null default 0.03,
  pct_margem_minima numeric(5,4) not null default 0.55,
  created_at      timestamptz not null default now()
);

alter table public.restaurantes enable row level security;

create policy "dono acessa apenas o próprio restaurante"
  on public.restaurantes for all
  using (dono_id = auth.uid())
  with check (dono_id = auth.uid());

-- ----------------------------------------------------------------
-- CANAIS DE VENDA
-- ----------------------------------------------------------------
create table public.canais_venda (
  id              uuid primary key default gen_random_uuid(),
  restaurante_id  uuid not null references public.restaurantes(id) on delete cascade,
  nome            text not null,
  pct_comissao    numeric(5,4) not null default 0,
  ativo           boolean not null default true
);

alter table public.canais_venda enable row level security;

create policy "acesso por restaurante"
  on public.canais_venda for all
  using (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ))
  with check (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ));

-- ----------------------------------------------------------------
-- CATEGORIAS DE INSUMO
-- ----------------------------------------------------------------
create table public.categorias_insumo (
  id              uuid primary key default gen_random_uuid(),
  restaurante_id  uuid not null references public.restaurantes(id) on delete cascade,
  nome            text not null
);

alter table public.categorias_insumo enable row level security;

create policy "acesso por restaurante"
  on public.categorias_insumo for all
  using (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ))
  with check (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ));

-- ----------------------------------------------------------------
-- INSUMOS
-- ----------------------------------------------------------------
create table public.insumos (
  id                uuid primary key default gen_random_uuid(),
  restaurante_id    uuid not null references public.restaurantes(id) on delete cascade,
  nome              text not null,
  categoria_id      uuid references public.categorias_insumo(id) on delete set null,
  unidade_compra    text not null,
  qtd_por_embalagem numeric(14,4) not null check (qtd_por_embalagem > 0),
  unidade_base      text not null check (unidade_base in ('g','ml','un')),
  preco_pago        numeric(14,4) not null check (preco_pago >= 0),
  fornecedor        text,
  fator_correcao    numeric(6,4) not null default 1 check (fator_correcao > 0),
  observacoes       text,
  arquivado         boolean not null default false,
  atualizado_em     timestamptz not null default now(),

  constraint nome_unico_por_restaurante unique (restaurante_id, nome)
);

alter table public.insumos enable row level security;

create policy "acesso por restaurante"
  on public.insumos for all
  using (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ))
  with check (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ));

-- Atualizar atualizado_em automaticamente
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger insumos_atualizado_em
  before update on public.insumos
  for each row execute function public.set_atualizado_em();

-- ----------------------------------------------------------------
-- HISTÓRICO DE PREÇOS
-- ----------------------------------------------------------------
create table public.historico_precos (
  id            uuid primary key default gen_random_uuid(),
  insumo_id     uuid not null references public.insumos(id) on delete cascade,
  preco         numeric(14,4) not null,
  registrado_em timestamptz not null default now()
);

alter table public.historico_precos enable row level security;

create policy "acesso via insumo"
  on public.historico_precos for all
  using (insumo_id in (
    select i.id from public.insumos i
    join public.restaurantes r on r.id = i.restaurante_id
    where r.dono_id = auth.uid()
  ))
  with check (insumo_id in (
    select i.id from public.insumos i
    join public.restaurantes r on r.id = i.restaurante_id
    where r.dono_id = auth.uid()
  ));

-- Trigger para gravar histórico ao alterar preço do insumo
create or replace function public.registrar_historico_preco()
returns trigger language plpgsql as $$
begin
  if new.preco_pago <> old.preco_pago then
    insert into public.historico_precos (insumo_id, preco)
    values (new.id, new.preco_pago);
  end if;
  return new;
end;
$$;

create trigger insumos_historico_preco
  after update on public.insumos
  for each row execute function public.registrar_historico_preco();

-- ----------------------------------------------------------------
-- RECEITAS
-- ----------------------------------------------------------------
create table public.receitas (
  id                 uuid primary key default gen_random_uuid(),
  restaurante_id     uuid not null references public.restaurantes(id) on delete cascade,
  nome               text not null,
  tipo               text not null check (tipo in ('prato','sub_receita')),
  rendimento         numeric(14,4) not null check (rendimento > 0),
  unidade_rendimento text not null,
  modo_preparo       text,
  foto_url           text,
  arquivado          boolean not null default false
);

alter table public.receitas enable row level security;

create policy "acesso por restaurante"
  on public.receitas for all
  using (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ))
  with check (restaurante_id in (
    select id from public.restaurantes where dono_id = auth.uid()
  ));

-- ----------------------------------------------------------------
-- ITENS DA RECEITA
-- ----------------------------------------------------------------
create table public.itens_receita (
  id              uuid primary key default gen_random_uuid(),
  receita_id      uuid not null references public.receitas(id) on delete cascade,
  insumo_id       uuid references public.insumos(id) on delete restrict,
  sub_receita_id  uuid references public.receitas(id) on delete restrict,
  qtd_liquida     numeric(14,4) not null check (qtd_liquida > 0),
  unidade         text not null,

  constraint item_insumo_ou_subrecipeita check (
    (insumo_id is not null and sub_receita_id is null) or
    (insumo_id is null and sub_receita_id is not null)
  )
);

alter table public.itens_receita enable row level security;

create policy "acesso via receita"
  on public.itens_receita for all
  using (receita_id in (
    select r.id from public.receitas r
    join public.restaurantes rest on rest.id = r.restaurante_id
    where rest.dono_id = auth.uid()
  ))
  with check (receita_id in (
    select r.id from public.receitas r
    join public.restaurantes rest on rest.id = r.restaurante_id
    where rest.dono_id = auth.uid()
  ));

-- ----------------------------------------------------------------
-- PREÇOS POR CANAL
-- ----------------------------------------------------------------
create table public.precos_canal (
  id                   uuid primary key default gen_random_uuid(),
  receita_id           uuid not null references public.receitas(id) on delete cascade,
  canal_id             uuid not null references public.canais_venda(id) on delete cascade,
  preco_venda          numeric(14,4) not null default 0,
  embalagem_insumo_id  uuid references public.insumos(id) on delete set null,

  constraint preco_canal_unico unique (receita_id, canal_id)
);

alter table public.precos_canal enable row level security;

create policy "acesso via receita"
  on public.precos_canal for all
  using (receita_id in (
    select r.id from public.receitas r
    join public.restaurantes rest on rest.id = r.restaurante_id
    where rest.dono_id = auth.uid()
  ))
  with check (receita_id in (
    select r.id from public.receitas r
    join public.restaurantes rest on rest.id = r.restaurante_id
    where rest.dono_id = auth.uid()
  ));
