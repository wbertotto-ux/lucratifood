# Insumos

`app/(app)/insumos/`  
`lib/actions/insumos.ts`  
Tabela: `insumos`

Cadastro de matérias-primas com cálculo automático de custo unitário.

## Campos principais

- Nome, categoria ([[Configurações]]), unidade de compra
- Quantidade por embalagem + unidade base (g / ml / un)
- Preço pago → custo por unidade base = `preco / qtd_por_embalagem`
- Fator de correção (perda na limpeza) — ex: 1,25 = 25% de perda
- Fornecedor, observações

## Actions

| Action | Limit check |
|---|---|
| `criarInsumo()` | ✓ verifica `max_insumos` |
| `duplicarInsumo()` | ✓ verifica `max_insumos` |
| `atualizarInsumo()` | — |
| `arquivarInsumo()` | — |
| `atualizarPrecosEmLote()` | — (usado no [[Impacto de Preço]]) |

## Importação CSV

`ImportacaoDialog.tsx` — PapaParse client-side. Campos obrigatórios: `nome, unidade_compra, qtd_por_embalagem, unidade_base, preco_pago`. Erros exibidos por linha.

## Conectado a

- [[Receitas — Fichas Técnicas]] — ingredientes das receitas
- [[Engine de Cálculo]] — insumos são a entrada do cálculo de custo
- [[Impacto de Preço]] — simula impacto de alteração de preço
- [[Configurações]] — categorias de insumo gerenciadas lá
- [[Planos — Assinatura]] — limite de 100 insumos no Essencial
