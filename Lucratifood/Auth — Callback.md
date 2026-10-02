# Auth — Callback

`app/auth/callback/route.ts`

Route handler que recebe o link mágico do Supabase (`?code=...`). Troca o code por sessão via `exchangeCodeForSession()`.

## Lógica de roteamento

| Condição | Destino |
|---|---|
| `?type=recovery` (reset de senha) | `/redefinir-senha` |
| Outro tipo (confirmação de email) | `/dashboard` (ou `?next=`) |
| Code inválido / ausente | `/login?erro=link_invalido` |

## Depende de

- [[Supabase — Auth]] — `exchangeCodeForSession()`

## Conectado a

- [[Auth — Login]] — destino de erro com `?erro=link_invalido`
- [[Auth — Recuperação de Senha]] — destino `?type=recovery`
- [[Dashboard — Painel]] — destino padrão de sucesso
