# Auth — Login

`app/(auth)/login/page.tsx`

Formulário de login com `supabase.auth.signInWithPassword()`. Exibe erros normalizados em português. Lê `?erro=link_invalido` da URL (vindo do [[Auth — Callback]]) para mostrar aviso de link expirado.

## Após sucesso

`router.push("/dashboard")` → [[Middleware — Proxy]] verifica assinatura e redireciona conforme.

## Depende de

- [[Supabase — Auth]] — `signInWithPassword()`
- [[Auth — Callback]] — redireciona para cá com `?erro=link_invalido`

## Conectado a

- [[Auth — Cadastro]] — link "criar conta"
- [[Auth — Recuperação de Senha]] — link "esqueci minha senha"
- [[Middleware — Proxy]] — controla acesso pós-login
- [[Dashboard — Painel]] — destino após login com assinatura ativa
- [[Planos — Assinatura]] — destino se sem assinatura
