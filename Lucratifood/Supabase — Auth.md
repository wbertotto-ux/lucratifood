# Supabase — Auth

`lib/supabase/server.ts` — `createClient()` (anon key + RLS)  
`lib/supabase/client.ts` — `createClient()` (browser)  
`lib/supabase/admin.ts` — `createAdminClient()` (service role, bypassa RLS)

## Dois tipos de cliente

| Cliente | Chave | RLS | Usado em |
|---|---|---|---|
| `createClient()` server | anon key | ✓ aplicada | Server Actions, Server Components, [[Middleware — Proxy]] |
| `createClient()` browser | anon key | ✓ aplicada | Client Components ([[Auth — Login]], [[Auth — Cadastro]]) |
| `createAdminClient()` | service role | ✗ bypassa | [[Webhook — Asaas]] (precisa escrever sem contexto de usuário) |

## Fluxo de sessão SSR

Supabase SSR mantém a sessão via cookies. [[Middleware — Proxy]] lê e renova os cookies a cada request.

## Conectado a

- [[Auth — Cadastro]] — `signUp()`
- [[Auth — Login]] — `signInWithPassword()`
- [[Auth — Recuperação de Senha]] — `resetPasswordForEmail()`, `updateUser()`
- [[Auth — Callback]] — `exchangeCodeForSession()`
- [[Middleware — Proxy]] — verifica sessão em cada request
- [[Webhook — Asaas]] — usa `createAdminClient()` para bypassar RLS
- [[Supabase — Banco de Dados]] — mesmo projeto, cliente diferente
