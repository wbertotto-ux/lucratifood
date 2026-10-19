-- Módulo GESTÃO: lançamento mensal de vendas por prato e canal
create table if not exists public.vendas_mes (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid references public.restaurantes(id)  on delete cascade,
  receita_id     uuid references public.receitas(id)      on delete cascade,
  canal_id       uuid references public.canais_venda(id)  on delete cascade,
  mes            text not null,
  quantidade     integer not null default 0,
  preco_unitario numeric(14,4) not null default 0,
  updated_at     timestamptz default now(),
  constraint vendas_mes_unique unique (restaurante_id, receita_id, canal_id, mes)
);

alter table public.vendas_mes enable row level security;

drop policy if exists "dono acessa proprias vendas" on public.vendas_mes;
create policy "dono acessa proprias vendas" on public.vendas_mes
  using (restaurante_id in (select id from public.restaurantes where dono_id = auth.uid()))
  with check (restaurante_id in (select id from public.restaurantes where dono_id = auth.uid()));

-- Painel admin: dados de contato coletados no onboarding
alter table public.restaurantes
  add column if not exists nome_dono text,
  add column if not exists cidade    text,
  add column if not exists estado    text;
