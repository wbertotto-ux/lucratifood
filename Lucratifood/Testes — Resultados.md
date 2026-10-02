# Testes Manuais — Resultados

> Executado em: 2026-10-02
> Ambiente: produção (lucratifood.com.br) · Asaas sandbox
> Conta de teste: `teste.lf.001@gmail.com` / `senha123`
> [[Índice|← Voltar ao índice]]

---

## Fluxo A — Cadastro + Pagamento

| # | Ação | Resultado | Obs |
|---|------|-----------|-----|
| A1 | Landing page | ✅ | "Entrar" + "Escolha seu plano" visíveis |
| A2 | → /planos | ✅ | Carrega Essencial e PRO corretamente |
| A3 | → /cadastro?plano=essencial | ✅ | Quando não logado, botão leva ao cadastro |
| A4 | E-mail inválido | ✅ | Tooltip nativo do browser "Inclua um @" |
| A5 | Senha < 6 chars | ✅ | "Mínimo 6 caracteres" em português |
| A6 | Senhas diferentes | ✅ | "Senhas não conferem" em português |
| A7 | Cadastro correto | ✅ | Loading "Criando conta…" → /onboarding |
| A8 | Onboarding padrão | ✅ | Defaults 6%/3%/55% pré-preenchidos |
| A9 | Submit onboarding | ✅ | Redireciona para /checkout?plano=essencial |
| A10 | Checkout sem CPF | ✅ | "Preencha este campo." bloqueou |
| A11 | Submit com CPF | ✅ | **"Processando…" com spinner** (B03 fix confirmado) |
| A12 | Página Asaas | ✅ | R$ 89,90, cliente "Confeitaria Teste", status correto |
| A13 | Confirmação pagamento | ⏳ | Aguarda confirmação manual no sandbox Asaas |
| A14 | Acesso dashboard | ⏳ | Aguarda A13 |

### Notas Fluxo A
- **Copy inconsistente:** `/onboarding` ainda usa "restaurante" (não atualizado)
- **Bug UX:** Usuário com assinatura pendente redirectionado para /planos sem botão de logout
- Conta criada: `teste.lf.001@gmail.com`, restaurante "Confeitaria Teste"

---

## Fluxo B — Login e Recuperação de Senha

| # | Ação | Resultado | Obs |
|---|------|-----------|-----|
| B1 | Logout | ⚠️ | Necessário limpar cookies manualmente (sem botão de logout sem assinatura) |
| B2 | Login com senha errada | ✅ | "E-mail ou senha incorretos." em português |
| B3 | Clicar "Esqueci minha senha" | 🔲 | Não testado |
| B4-B8 | Recuperação de senha | 🔲 | Não testado |

---

## Fluxos C–G

> Aguardam ativação da assinatura de teste (A13/A14).

| Fluxo | Status |
|-------|--------|
| C — Insumos | ⏳ |
| D — Receitas | ⏳ |
| E — Configurações | ⏳ |
| F — Dashboard | ⏳ |
| G — Minha Conta | ⏳ |

---

## Como continuar os testes

1. Ativar a assinatura do usuário de teste `teste.lf.001@gmail.com` em produção:
   - **Opção A:** Acessar o Asaas sandbox dashboard, localizar o pagamento e simular confirmação
   - **Opção B:** Executar no Supabase SQL Editor:
     ```sql
     UPDATE assinaturas 
     SET status = 'ativo' 
     WHERE status = 'pendente' 
       AND restaurante_id = (
         SELECT id FROM restaurantes WHERE nome = 'Confeitaria Teste'
       );
     ```
2. Voltar a lucratifood.com.br/login, logar com `teste.lf.001@gmail.com` / `senha123`
3. Continuar com Fluxos C–G
