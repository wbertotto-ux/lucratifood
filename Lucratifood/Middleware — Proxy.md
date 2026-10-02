# Middleware — Proxy

`proxy.ts` ← **este é o middleware** (Next.js 16 usa `proxy.ts`, não `middleware.ts`)

Controla o acesso a todas as rotas. Roda no Edge antes de qualquer page/layout.

## Lógica de roteamento

```
Sem sessão + rota protegida  → /login
Com sessão + sem restaurante → /onboarding
Com sessão + sem assinatura  → /planos?pendente=1
Com sessão + assinatura ativa → passa (acessa o app)
Rota pública (/, /planos, /login, /cadastro...) → passa sempre
```

## Depende de

- [[Supabase — Auth]] — verifica sessão via cookies SSR
- [[Planos — Assinatura]] — `getAssinaturaAtiva()` para checar acesso
- [[Restaurante]] — verifica se onboarding foi feito

## Conectado a

- [[Auth — Login]] — destino quando sem sessão
- [[Onboarding]] — destino quando sem restaurante
- [[Planos — Assinatura]] — destino quando sem assinatura
- [[Dashboard — Painel]] — liberado quando tudo ok
- Todos os módulos do app — protegidos por aqui

## Atenção

Nunca criar `middleware.ts` — conflita com `proxy.ts` e quebra o roteamento.
