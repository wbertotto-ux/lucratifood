-- PARTE 1: alinha o banco com o que o código já usa (tudo idempotente)

alter table public.restaurantes
  add column if not exists porcoes_mes_estimado numeric not null default 300;

alter table public.receitas
  add column if not exists pct_margem_desejada numeric;

alter table public.insumos drop constraint if exists insumos_unidade_base_check;
alter table public.insumos
  add constraint insumos_unidade_base_check check (unidade_base in ('g','kg','ml','l','un'));

create table if not exists public.custos_operacionais (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null references public.restaurantes(id) on delete cascade,
  categoria      text not null,
  descricao      text not null,
  valor_mensal   numeric(14,2) not null default 0 check (valor_mensal >= 0),
  ativo          boolean not null default true,
  created_at     timestamptz default now()
);

alter table public.custos_operacionais enable row level security;

drop policy if exists "acesso por restaurante" on public.custos_operacionais;
create policy "acesso por restaurante" on public.custos_operacionais
  for all to authenticated
  using (restaurante_id in (select id from public.restaurantes where dono_id = auth.uid()))
  with check (restaurante_id in (select id from public.restaurantes where dono_id = auth.uid()));

create index if not exists custos_operacionais_restaurante_idx on public.custos_operacionais (restaurante_id);
create index if not exists vendas_mes_restaurante_mes_idx on public.vendas_mes (restaurante_id, mes);

-- PARTE 2: segurança das assinaturas e leitura dos planos
-- Antes: o dono tinha ALL na própria assinatura (podia se marcar como 'ativo'/PRO sem pagar)
-- e a policy "service_assinaturas_update" liberava UPDATE para o papel public.
-- Agora: o dono só lê e só cria assinatura PENDENTE. Ativar/suspender/cancelar é feito
-- exclusivamente pelo webhook, que usa a service role e ignora RLS.

drop policy if exists service_assinaturas_update on public.assinaturas;
drop policy if exists owner_assinaturas on public.assinaturas;
drop policy if exists assinaturas_dono_le on public.assinaturas;
drop policy if exists assinaturas_dono_cria_pendente on public.assinaturas;

create policy assinaturas_dono_le on public.assinaturas
  for select to authenticated
  using (restaurante_id in (select id from public.restaurantes where dono_id = auth.uid()));

create policy assinaturas_dono_cria_pendente on public.assinaturas
  for insert to authenticated
  with check (
    status = 'pendente'
    and restaurante_id in (select id from public.restaurantes where dono_id = auth.uid())
  );

-- planos tinha RLS ligado sem policy: o app não conseguia ler os limites (max_receitas etc.)
drop policy if exists planos_leitura on public.planos;
create policy planos_leitura on public.planos
  for select to anon, authenticated
  using (true);

-- Funções com search_path fixo (avisos do advisor de segurança)
alter function public.set_atualizado_em() set search_path = public;
alter function public.registrar_historico_preco() set search_path = public;
