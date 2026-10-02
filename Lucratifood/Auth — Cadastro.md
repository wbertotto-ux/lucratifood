# Auth — Cadastro

`app/(auth)/cadastro/page.tsx`

Formulário de criação de conta com validação Zod (email, senha ≥ 6 chars, confirmação). Chama `supabase.auth.signUp()`. Erros do Supabase normalizados em português.

## Após sucesso

Redireciona para [[Onboarding]] com `?plano=essencial|pro`.

## Depende de

- [[Supabase — Auth]] — `signUp()`
- [[Planos — Assinatura]] — param `?plano` passado via URL

## Conectado a

- [[Auth — Login]] — link "já tem conta?"
- [[Auth — Recuperação de Senha]]
- [[Middleware — Proxy]] — redireciona usuários já logados

## Regras de negócio

- Se usuário já autenticado com assinatura ativa → [[Middleware — Proxy]] redireciona para [[Dashboard — Painel]]
- Erros cobertos: email duplicado, senha fraca, rate limit, email inválido
