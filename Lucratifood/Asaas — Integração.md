# Asaas — Integração

`lib/asaas.ts`

Camada de comunicação com a API do Asaas (plataforma de cobranças). Todas as chamadas passam pelo helper `req()` que injeta o `access_token`.

## Funções exportadas

| Função | Endpoint | Usado por |
|---|---|---|
| `criarCliente()` | POST /customers | [[Checkout — Pagamento]] |
| `criarAssinatura()` | POST /subscriptions + GET /payments | [[Checkout — Pagamento]] |
| `buscarInvoiceUrl()` | GET /payments?subscription= | [[Checkout — Pagamento]] |
| `cancelarAssinatura()` | DELETE /subscriptions/:id | Futuro: cancelamento |

## Configuração

- `ASAAS_BASE_URL` — sandbox: `https://sandbox.asaas.com/api/v3` / produção: `https://api.asaas.com/v3`
- `ASAAS_API_KEY` — chave de API (Vercel secret)
- Ambas definidas como env vars no Vercel (nunca no `.env.local`)

## Ciclo de cobrança

`criarAssinatura()` retorna `invoiceUrl` buscando o primeiro pagamento da subscription. A `invoiceUrl` leva o usuário à página de pagamento do Asaas (Pix, cartão, boleto).

## Conectado a

- [[Checkout — Pagamento]] — consumidor principal
- [[Webhook — Asaas]] — Asaas notifica de volta via webhook
- [[Planos — Assinatura]] — resultado da cobrança altera o status

## Estado atual

Ambiente **sandbox**. Migrar para produção: trocar `ASAAS_BASE_URL` e `ASAAS_API_KEY` no Vercel.
