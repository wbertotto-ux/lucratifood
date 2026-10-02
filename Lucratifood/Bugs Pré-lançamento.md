# Bugs Pré-lançamento

> Última atualização: 2026-10-02
> [[Índice|← Voltar ao índice]]

---

## ✅ Corrigidos (deploy em produção)

| ID | Local | Descrição | Fix |
|----|-------|-----------|-----|
| B03 | checkout | Sem loading no botão "Assinar" — duplo-submit | `CheckoutSubmitButton.tsx` com `useFormStatus` |
| B05 | `duplicarInsumo` | Não verificava limite de plano ao duplicar | Adicionada verificação de contagem + limite |
| B06 | `criarCanal` | Contava canais inativos no limite de 1 canal | Adicionado `.eq("ativo", true)` no count |
| B07 | `InsumoFormDialog` | Erro de servidor fechava dialog sem mensagem | `try/catch` + `normalizarErroInsumo()` |
| B08 | `NovaReceitaDialog` | Sem `catch` — erro de limite → tela de erro Next.js | `try/catch` + `normalizarErroReceita()` |
| B09 | `ConfiguracoesClient` | Erro de limite no canal não tratado | `try/catch` em `handleNovoCanal` |
| B10 | `FichaTecnicaEditor` | Ingrediente salvo com quantidade zero | Validação antes do `salvar()` |
| B11 | Painel + FichaTecnica | "Esta ação não pode ser desfeita" para arquivar — reversível | Texto corrigido |
| B16 | `cadastro/page.tsx` | Erros Supabase em inglês | Normalização para português |
| B20 | checkout | Sem loading no botão de checkout | Resolvido junto com B03 |

---

## 🔴 Críticos — Corrigir antes do lançamento

| ID | Local | Descrição | Impacto |
|----|-------|-----------|---------|
| B04 | `app/api/asaas/webhook` | Se `ASAAS_WEBHOOK_TOKEN` não configurado → sempre 401 | Pagamento sem acesso |

> **Verificar:** confirmar que `ASAAS_WEBHOOK_TOKEN` está configurado no Vercel em produção.

---

## 🟡 Funcionais — Importantes mas não bloqueiam lançamento

| ID | Local | Descrição | Impacto |
|----|-------|-----------|---------|
| B01 | `salvarItensReceita`, `salvarPrecosCanal` | DELETE + INSERT sem transação — falha de rede apaga dados | Perda de ingredientes |
| B02 | `aplicarTodos` em `/impacto` | Apaga preços de canais não incluídos nos resultados | Perda de preços |
| B12 | `PainelClient` | Médias de vendas em `localStorage` sem namespace | Dados compartilhados entre contas |
| B13 | `excluirCategoria` | Sem verificar dependências antes de excluir | Possível erro 500 |
| B14 | `app/auth/callback` | `?erro=link_invalido` não exibido ao usuário no /login | Usuário sem contexto de erro |
| B15 | `checkout/page.tsx` | CPF/CNPJ sem validação de dígitos verificadores | Asaas rejeita sem mensagem clara |

---

## 🟢 Novos — Encontrados nos testes manuais

| ID | Local | Descrição | Impacto |
|----|-------|-----------|---------|
| B-NEW1 | `/planos?pendente=1` | Usuário com assinatura pendente não tem botão de logout | Preso na tela de planos |
| B-NEW2 | `/onboarding` | Ainda usa "restaurante" em vez de "negócio" na copy | Inconsistência de linguagem |

---

## ⚪ Menores — UX/polish

| ID | Local | Descrição |
|----|-------|-----------|
| B17 | configurações | Canal existente não pode ser editado pela UI |
| B18 | `receitas/[id]` | Busca de ingredientes trunca em 15 sem aviso |
| B19 | onboarding | Botão "Começar a usar" sem loading (Server Action) |
