# Checklist de Lançamento

> [[Índice|← Voltar ao índice]]

---

## 🔴 Bloqueadores (obrigatório antes de lançar)

- [ ] **Migrar Asaas do sandbox para produção**
  - Atualizar `ASAAS_BASE_URL` de `sandbox.asaas.com/api/v3` → `api.asaas.com/v3` no Vercel
  - Atualizar `ASAAS_API_KEY` para chave de produção
  - Confirmar que `ASAAS_WEBHOOK_TOKEN` está configurado no Vercel
  - Confirmar webhook configurado no painel Asaas produção apontando para `https://lucratifood.com.br/api/asaas/webhook`

- [ ] **Testar webhook de pagamento em produção**
  - Fazer um pagamento real (ou simular via API Asaas produção)
  - Verificar que status muda de `pendente` → `ativo` no Supabase

- [ ] **Completar testes Fluxos C–G** (ver [[Testes — Resultados]])

---

## 🟡 Importante (resolver em breve após lançamento)

- [ ] Adicionar botão de logout na tela `/planos?pendente=1` (B-NEW1)
- [ ] Corrigir copy "restaurante" → "negócio" na tela de onboarding (B-NEW2)
- [ ] Adicionar transação ao salvar itens de receita e preços por canal (B01)
- [ ] Validação de CPF/CNPJ com dígitos verificadores no checkout (B15)
- [ ] Namespace no localStorage para médias de vendas (B12)

---

## 🟢 Confirmados e funcionando

- [x] Cadastro com validações (e-mail, senha, confirmação)
- [x] Onboarding com defaults corretos (6%/3%/55%)
- [x] Checkout com loading state "Processando…" (anti duplo-submit)
- [x] Redirecionamento para Asaas com dados corretos do cliente
- [x] Limite de plano com mensagem clara (insumos, receitas, canais)
- [x] Duplicar insumo respeita limite do plano
- [x] Canais inativos não contam no limite
- [x] Erro de ingrediente com quantidade zero bloqueado
- [x] Texto de arquivar receita corrigido (reversível)
- [x] Erros do Supabase em português no cadastro e login
- [x] Copy landing page/planos usa linguagem de gastronomia (não "restaurante")

---

## Após lançamento

- [ ] Monitorar webhook logs no Vercel
- [ ] Remover `console.log` de debug do webhook handler
- [ ] Configurar alertas de erro (Sentry ou similar)
- [ ] Testar fluxo de cancelamento (webhook `SUBSCRIPTION_DELETED`)
- [ ] Testar upgrade Essencial → PRO
