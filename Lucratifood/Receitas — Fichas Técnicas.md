# Receitas — Fichas Técnicas

`app/(app)/receitas/`  
`app/(app)/receitas/[id]/`  
`lib/actions/receitas.ts`  
Tabelas: `receitas`, `itens_receita`, `precos_canal`

Módulo central do produto. Uma receita pode ser **prato** (vendável) ou **sub-receita** (ingrediente de outra receita).

## Estrutura de dados

```
receita
  ├── itens_receita[]  ← insumos ou sub-receitas com quantidade
  └── precos_canal[]   ← preço de venda por canal
```

## Cálculo de custo

`custoPorcao(receita, insumoMap, srMap)` — [[Engine de Cálculo]] percorre os `itens_receita`, converte unidades e soma custos. Sub-receitas são resolvidas recursivamente.

## Salvar ingredientes — padrão seguro

`salvarItensReceita()`: INSERT primeiro (select IDs) → DELETE somente os não incluídos. Evita janela sem dados se a rede cair.

`salvarPrecosCanal()`: UPSERT (constraint unique receita+canal) → DELETE canais removidos.

## Conectado a

- [[Insumos]] — ingredientes das fichas
- [[Canais de Venda]] — preços por canal definidos aqui
- [[Engine de Cálculo]] — calcula custo e preço sugerido
- [[Dashboard — Painel]] — pratos aparecem com margens
- [[Impacto de Preço]] — recalcula preços ao mudar insumo
- [[Planos — Assinatura]] — limite de 30 pratos no Essencial
- [[Configurações]] — margem mínima e taxas vêm do [[Restaurante]]
