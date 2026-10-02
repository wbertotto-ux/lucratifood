# Canais de Venda

Tabela: `canais_venda`  
Gerenciados em [[Configurações]]

Representam os pontos de venda (Salão, iFood, WhatsApp, etc.) com percentual de comissão próprio. Cada canal pode ter um preço diferente para a mesma receita.

## Criados automaticamente

No [[Onboarding]], a action `criarRestaurante()` insere os 3 canais padrão: **Salão** (0%), **iFood** (30%), **WhatsApp** (0%).

## Impacto no cálculo

```
preço sugerido = custo / (1 - margem - impostos - taxaCartão - comissão_canal)
```
Ver [[Engine de Cálculo]].

## Limite por plano

- **Essencial**: 1 canal ativo (canais inativos não contam no limite)
- **PRO**: ilimitados

## Conectado a

- [[Onboarding]] — criados na configuração inicial
- [[Configurações]] — CRUD e ativação
- [[Receitas — Fichas Técnicas]] — preços definidos por canal na ficha
- [[Engine de Cálculo]] — comissão entra no cálculo do preço sugerido
- [[Dashboard — Painel]] — seletor de canal; margem calculada por canal
- [[Impacto de Preço]] — preços atualizados por canal
- [[Planos — Assinatura]] — controla o limite de canais ativos
