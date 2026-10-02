# Webhook — Asaas

`app/api/asaas/webhook/route.ts`

Route handler POST que recebe eventos do Asaas. Autenticado via header `asaas-access-token` comparado com `ASAAS_WEBHOOK_TOKEN`.

## Eventos tratados

| Evento | Ação |
|---|---|
| `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` | Atualiza `assinaturas.status` → `ativo` |
| `SUBSCRIPTION_DELETED` | Atualiza `assinaturas.status` → `cancelado` |

## Segurança

- Usa `createAdminClient()` ([[Supabase — Auth]]) com service role key — bypassa RLS
- `ASAAS_WEBHOOK_TOKEN` = `lf-webhook-secret-2026` (configurado no painel Asaas e no Vercel)
- Sem esse token configurado → sempre 401 → assinatura nunca ativa (bug crítico se ausente)

## Depende de

- [[Supabase — Auth]] — `createAdminClient()` (service role)
- [[Supabase — Banco de Dados]] — tabela `assinaturas`
- [[Planos — Assinatura]] — entidade que é atualizada

## Conectado a

- [[Asaas — Integração]] — origem dos eventos
- [[Planos — Assinatura]] — muda o status aqui
- [[Dashboard — Painel]] — passa a ser acessível após webhook ativar
