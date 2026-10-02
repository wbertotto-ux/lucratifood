# Engine de Cálculo

`lib/calculos.ts`  
`lib/formatacao.ts`

Funções puras (sem side effects, sem I/O) que fazem toda a matemática de precificação.

## Funções principais

### `custoPorcao(receita, insumoMap, srMap)`
Calcula o custo de ingredientes por porção. Converte unidades (g↔kg, ml↔L), aplica fator de correção dos [[Insumos]], resolve sub-receitas recursivamente.

### `precoSugerido(custo, pctMargem, pctImpostos, pctTaxaCartao, pctComissao)`
Markup reverso:
```
preço = custo / (1 - margem - impostos - taxaCartao - comissao)
```
Todos os percentuais vêm do [[Restaurante]] e [[Canais de Venda]].

### `margemContribuicao(preco, custo, impostos, taxaCartao, comissao)`
Margem real = `preco - custo - deduções`.

### `cmvPct(custo, preco)`
CMV = custo / preço × 100.

## Quem usa

- [[Receitas — Fichas Técnicas]] — custo por porção
- [[Dashboard — Painel]] — margem, CMV, preço sugerido de todos os pratos
- [[Impacto de Preço]] — recalcula após mudança de preço de insumo

## Conectado a

- [[Insumos]] — dados de entrada (preço, fator de correção, unidade)
- [[Restaurante]] — parâmetros: impostos, taxa cartão, margem mínima
- [[Canais de Venda]] — comissão por canal
- [[Custos Operacionais]] — custo operacional por porção somado ao custo de ingredientes
