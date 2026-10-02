# Impacto de Preço

`app/(app)/impacto/`  
`ImpactoClient.tsx`

Ferramenta de simulação: ao alterar o preço de um [[Insumos|insumo]], calcula o impacto em todas as [[Receitas — Fichas Técnicas|receitas]] que o usam.

## Como funciona

1. Usuário edita o preço de um insumo na tela de [[Insumos]]
2. Antes de salvar, pode acessar `/impacto?insumoId=...&novoPreco=...`
3. O page Server Component recalcula via [[Engine de Cálculo]] o custo novo de cada prato afetado
4. Mostra tabela: custo anterior / custo novo / variação de margem / preço sugerido novo
5. Botão "Aplicar todos" → `upsertPrecosCanal()` — atualiza só os canais mostrados, sem apagar os demais

## `upsertPrecosCanal()` vs `salvarPrecosCanal()`

- `upsertPrecosCanal()` — atualização **parcial**: UPSERT sem DELETE. Usado aqui para não apagar preços de canais não afetados.
- `salvarPrecosCanal()` — substituição **total**: UPSERT + DELETE not-in-set. Usado ao salvar a ficha técnica completa.

## Conectado a

- [[Insumos]] — origem do fluxo (preço alterado)
- [[Receitas — Fichas Técnicas]] — receitas afetadas recalculadas
- [[Engine de Cálculo]] — recalcula custo e margem
- [[Canais de Venda]] — preços atualizados por canal
