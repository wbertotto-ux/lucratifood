# Onboarding

`app/onboarding/page.tsx`  
`lib/actions/onboarding.ts` — `criarRestaurante()`

Página pós-cadastro onde o usuário configura o negócio. Server Component com Server Action.

## Dados coletados

- Nome do negócio
- Impostos (%) — padrão 6%
- Taxa de cartão (%) — padrão 3%
- Margem mínima (%) — padrão 55%

## O que a action faz (`criarRestaurante`)

1. Insere registro em `restaurantes`
2. Cria automaticamente 3 [[Canais de Venda]] padrão: Salão, iFood, WhatsApp
3. Redireciona para [[Checkout — Pagamento]]

## Depende de

- [[Supabase — Banco de Dados]] — tabela `restaurantes`, `canais_venda`
- [[Restaurante]] — entidade central criada aqui

## Conectado a

- [[Auth — Cadastro]] — origem do fluxo
- [[Checkout — Pagamento]] — destino após configurar
- [[Canais de Venda]] — criados automaticamente aqui
- [[Configurações]] — permite editar depois
