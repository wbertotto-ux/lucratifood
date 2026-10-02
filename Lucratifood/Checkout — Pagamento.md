# Checkout — Pagamento

`app/(auth)/checkout/page.tsx`  
`lib/actions/checkout.ts` — `iniciarCheckout()`

Página de confirmação de assinatura. Coleta CPF/CNPJ (com validação de dígito verificador) e redireciona para o Asaas.

## Fluxo da action `iniciarCheckout`

1. Valida CPF/CNPJ (checksum) — erro `?erro=documento`
2. Verifica assinatura **ativa** → redireciona para [[Dashboard — Painel]]
3. Verifica assinatura **pendente** → busca invoice já existente no [[Asaas — Integração]] e redireciona (evita duplicata)
4. Cria cliente no [[Asaas — Integração]]
5. Cria assinatura no [[Asaas — Integração]]
6. Salva registro `pendente` em `assinaturas` ([[Planos — Assinatura]])
7. Redireciona para `invoiceUrl` do Asaas

## Proteção contra duplo-submit

- `CheckoutSubmitButton` usa `useFormStatus` — botão desabilitado enquanto pending
- Server action bloqueia duplicatas verificando status `pendente` no banco

## Depende de

- [[Asaas — Integração]] — `criarCliente()`, `criarAssinatura()`, `buscarInvoiceUrl()`
- [[Planos — Assinatura]] — lê e grava `assinaturas`
- [[Supabase — Banco de Dados]] — tabela `assinaturas`
- [[Restaurante]] — `restaurante_id` e nome do cliente

## Conectado a

- [[Onboarding]] — origem do fluxo
- [[Webhook — Asaas]] — ativa a assinatura após pagamento
- [[Planos — Assinatura]] — gerencia o estado
