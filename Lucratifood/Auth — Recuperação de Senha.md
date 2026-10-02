# Auth — Recuperação de Senha

`app/(auth)/esqueci-senha/page.tsx`  
`app/(auth)/redefinir-senha/page.tsx`  
`app/auth/callback/route.ts`

Fluxo de três etapas:
1. Usuário digita email → `supabase.auth.resetPasswordForEmail()`
2. Link do e-mail → [[Auth — Callback]] (`?type=recovery`) → redireciona para `/redefinir-senha`
3. Usuário define nova senha → `supabase.auth.updateUser()`

## Depende de

- [[Supabase — Auth]] — `resetPasswordForEmail()`, `updateUser()`
- [[Auth — Callback]] — processa o link mágico

## Conectado a

- [[Auth — Login]] — retorno após redefinição bem-sucedida
- [[Dashboard — Painel]] — destino final se sessão ativa
