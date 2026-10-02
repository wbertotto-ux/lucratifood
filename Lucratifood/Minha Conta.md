# Minha Conta

Rotas: `app/(app)/conta/`  
Arquivos: `ContaClient.tsx`, `page.tsx`

## Abas

### Plano
- Status atual da assinatura (Ativo / Pendente / Cancelado)
- Nome do plano (Essencial / PRO), valor mensal
- Botão "Fazer upgrade para o PRO" — visível apenas no plano Essencial
- Link para portal do cliente Asaas (gerenciar pagamento, cancelar)

### Perfil
- Alterar senha via `supabase.auth.updateUser({ password })`
- Validação: senha atual obrigatória, mínimo 6 chars, confirmação deve coincidir

### Negócio
- Editar nome do restaurante (`UPDATE restaurantes SET nome = ...`)
- Editar parâmetros financeiros: impostos, taxa de cartão, margem mínima
- Redireciona ao salvar → revalida `/conta` e `/dashboard`

## Acesso ao plano

Lê `assinaturas` com `.maybeSingle()`:
```ts
const { data: assinatura } = await supabase
  .from("assinaturas")
  .select("*, planos(*)")
  .eq("restaurante_id", restaurante.id)
  .eq("status", "ativo")
  .maybeSingle();
```

## Conectado a

- [[Planos — Assinatura]] — exibe status e plano atual
- [[Restaurante]] — dados do negócio editados aqui
- [[Supabase — Auth]] — `updateUser()` para troca de senha
- [[Asaas — Integração]] — link para portal do cliente
- [[Configurações]] — parâmetros financeiros também editáveis lá
