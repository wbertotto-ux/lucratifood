-- Expande o CHECK constraint da coluna tipo em receitas
-- para aceitar 'lanche' e 'petisco' além de 'prato' e 'sub_receita'

alter table public.receitas
  drop constraint if exists receitas_tipo_check;

alter table public.receitas
  add constraint receitas_tipo_check
  check (tipo in ('prato', 'lanche', 'petisco', 'sub_receita'));
