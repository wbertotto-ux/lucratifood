-- Planos disponíveis
create table if not exists public.planos (
  id           text primary key,
  nome         text not null,
  preco_mensal numeric(10,2) not null,
  max_receitas int,            -- null = ilimitado
  max_insumos  int,            -- null = ilimitado
  max_canais   int             -- null = ilimitado
);

insert into public.planos (id, nome, preco_mensal, max_receitas, max_insumos, max_canais)
values
  ('essencial', 'Essencial', 89.90,  30,   100,  1),
  ('pro',       'PRO',       179.90, null, null, null)
on conflict (id) do nothing;

-- Assinaturas (uma por restaurante)
create table if not exists public.assinaturas (
  id                    uuid primary key default gen_random_uuid(),
  restaurante_id        uuid not null references public.restaurantes(id) on delete cascade,
  plano_id              text not null references public.planos(id),
  status                text not null default 'pendente',  -- pendente | ativo | suspenso | cancelado
  vigencia_ate          timestamptz,
  asaas_customer_id     text,
  asaas_subscription_id text,
  created_at            timestamptz default now()
);

alter table public.assinaturas enable row level security;

create policy "owner_assinaturas" on public.assinaturas
  using (
    restaurante_id in (
      select id from public.restaurantes where dono_id = auth.uid()
    )
  );

-- Service role pode atualizar (para o webhook)
create policy "service_assinaturas_update" on public.assinaturas
  for update
  using (true)
  with check (true);
