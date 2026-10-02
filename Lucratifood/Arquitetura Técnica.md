# Arquitetura Técnica

> [[Índice|← Voltar ao índice]]

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.3.6 (App Router, Turbopack) |
| UI | shadcn/ui + Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Auth | Supabase Auth (SSR via `@supabase/ssr`) |
| Pagamentos | Asaas (sandbox → produção) |
| Deploy | Vercel |
| Forms | react-hook-form + zod |

---

## Estrutura de rotas

```
app/
  page.tsx                  ← Landing page
  (auth)/
    cadastro/               ← Cadastro de conta
    login/                  ← Login
    onboarding/             ← Configuração inicial pós-cadastro
    checkout/               ← Resumo + CPF → Asaas
    esqueci-senha/          ← Recovery
    redefinir-senha/        ← Reset
  auth/callback/            ← Supabase auth callback
  (app)/                    ← Área protegida (requer assinatura ativa)
    dashboard/              ← Painel de margens
    insumos/                ← CRUD de insumos
    receitas/               ← CRUD de receitas
    receitas/[id]/          ← Editor de ficha técnica
    impacto/                ← Simulador de impacto de preço
    configuracoes/          ← Configurações do negócio
    conta/                  ← Minha conta (plano, perfil, negócio)
  api/asaas/webhook/        ← Recebe eventos do Asaas
  planos/                   ← Página pública de planos
```

---

## Decisões técnicas importantes

### Middleware: proxy.ts (não middleware.ts)
> Next.js 16 conflita se ambos existirem. `proxy.ts` É o middleware. Nunca criar `middleware.ts`.

### Supabase SSR
- `createClient()` → usa anon key, respeita RLS, usa sessão do usuário
- `createAdminClient()` → usa service role key, bypassa RLS, só no servidor

### RLS em assinaturas
- Usuário só lê sua própria assinatura (policy owner)
- Webhook usa `createAdminClient()` para atualizar status (service role bypassa RLS)

### Limites de plano
- `getAssinaturaAtiva()` retorna `max_receitas`, `max_insumos`, `max_canais` (null = ilimitado)
- Erros de limite: formato `LIMITE_PLANO:resource:number` (ex: `LIMITE_PLANO:insumos:100`)
- UI normaliza para mensagem amigável via `normalizarErroXxx()`

### BYPASS_SUBSCRIPTION
- `BYPASS_SUBSCRIPTION=true` em `.env.local` ignora verificação de assinatura
- Apenas em desenvolvimento local — nunca em produção

---

## Integrações

### Asaas
- Sandbox: `https://sandbox.asaas.com/api/v3`
- Produção: `https://api.asaas.com/v3`
- Variáveis: `ASAAS_BASE_URL`, `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`
- Eventos tratados: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_DELETED`

### Supabase
- URL: `https://djbtiipoymmwurvrnhfj.supabase.co`
- Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## Banco de dados (tabelas principais)

| Tabela | Descrição |
|--------|-----------|
| `restaurantes` | Configuração do negócio (nome, %, margem) |
| `assinaturas` | Status da assinatura (pendente/ativo/suspenso/cancelado) |
| `planos` | Limites por plano (max_receitas, max_insumos, max_canais) |
| `insumos` | Ingredientes com preço por unidade |
| `receitas` | Fichas técnicas (pratos e sub-receitas) |
| `receita_itens` | Ingredientes de cada receita |
| `canais_venda` | Canais (Salão, iFood, etc.) com % comissão |
| `receita_precos` | Preço e CMV por receita+canal |
| `custos_operacionais` | Custos fixos rateados por porção |
| `categorias_insumo` | Categorias de ingredientes |
