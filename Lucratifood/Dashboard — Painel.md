# Dashboard — Painel

`app/(app)/dashboard/page.tsx` (Server Component)  
`app/(app)/dashboard/PainelClient.tsx` (Client Component)

Visão geral de todos os pratos com custo, preço, CMV e margem por canal.

## Dados carregados no server

- Todos os pratos não arquivados + seus itens e preços
- Insumos + sub-receitas (para o [[Engine de Cálculo]])
- [[Canais de Venda]] ativos
- [[Restaurante]] (parâmetros de cálculo)
- [[Custos Operacionais]] ativos → custo por porção somado ao custo de cada prato

## Features por plano

| Feature | Essencial | PRO |
|---|---|---|
| Lista de pratos com margens | ✓ | ✓ |
| Ordenação por margem/CMV | ✓ | ✓ |
| Projeção mensal (média de vendas) | ✓ | ✓ |
| Gráficos de análise (3) | blur/teaser | ✓ |
| Alertas de margem | — | ✓ |

## Médias de vendas (localStorage)

Salvas em `localStorage` com chave `medias_vendas_mes_${restauranteId}` — namespaced por restaurante para evitar vazamento entre contas no mesmo browser.

## Conectado a

- [[Receitas — Fichas Técnicas]] — pratos exibidos
- [[Engine de Cálculo]] — todas as métricas calculadas aqui
- [[Canais de Venda]] — seletor de canal; preço e margem por canal
- [[Custos Operacionais]] — custo operacional por porção somado
- [[Planos — Assinatura]] — controla features visíveis (PRO gate)
- [[Impacto de Preço]] — link de acesso a partir dos insumos
