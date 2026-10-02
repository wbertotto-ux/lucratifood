# Planos — Assinatura

`app/planos/page.tsx`  
`lib/assinaturas.ts` — `getAssinaturaAtiva()`  
Tabelas: `planos`, `assinaturas`

Define os limites de uso do app e controla o acesso às features.

## Planos disponíveis

| Feature | Essencial (R$ 89,90) | PRO (R$ 179,90) |
|---|---|---|
| Fichas técnicas | até 30 | ilimitadas |
| Insumos | até 100 | ilimitados |
| Canais de venda | 1 ativo | ilimitados |
| Painel de margens | básico | completo |
| Gráficos / alertas / CSV / export | ✗ | ✓ |

## `getAssinaturaAtiva(restauranteId)`

Função central usada em toda a camada de actions para verificar limites. Retorna `{ plano_id, max_receitas, max_insumos, max_canais }` ou `null`.

## Onde os limites são verificados

- [[Insumos]] — `criarInsumo()`, `duplicarInsumo()`
- [[Receitas — Fichas Técnicas]] — `criarReceita()`
- [[Canais de Venda]] — `criarCanal()`

## Conectado a

- [[Checkout — Pagamento]] — origem da assinatura
- [[Webhook — Asaas]] — ativa / cancela a assinatura
- [[Middleware — Proxy]] — bloqueia acesso sem assinatura ativa
- [[Dashboard — Painel]] — controla features visíveis (PRO gate)
- [[Minha Conta]] — exibe status e plano atual
- [[Insumos]] — limita quantidade
- [[Receitas — Fichas Técnicas]] — limita quantidade
- [[Canais de Venda]] — limita quantidade
