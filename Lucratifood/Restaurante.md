# Restaurante

Tabela: `restaurantes`  
Criado em [[Onboarding]]

Entidade central do sistema. Cada usuário tem um restaurante. Todos os outros dados (insumos, receitas, canais, custos) pertencem ao restaurante via `restaurante_id`.

## Campos

| Campo | Uso |
|---|---|
| `nome` | Exibição, cliente no [[Asaas — Integração]] |
| `pct_impostos` | [[Engine de Cálculo]] — dedução sobre preço |
| `pct_taxa_cartao` | [[Engine de Cálculo]] — dedução sobre preço |
| `pct_margem_minima` | [[Engine de Cálculo]] e [[Dashboard — Painel]] — alerta de margem |
| `porcoes_mes_estimado` | [[Custos Operacionais]] — rateio de custo fixo |

## RLS (Row Level Security)

Todas as tabelas filhas usam `restaurante_id` para filtrar dados por usuário. As políticas verificam `dono_id = auth.uid()` via join com `restaurantes`.

## Conectado a

- [[Onboarding]] — criado aqui
- [[Configurações]] — editado aqui
- [[Engine de Cálculo]] — parâmetros de cálculo
- [[Supabase — Banco de Dados]] — raiz da hierarquia de dados
- [[Insumos]] — pertencem ao restaurante
- [[Receitas — Fichas Técnicas]] — pertencem ao restaurante
- [[Canais de Venda]] — pertencem ao restaurante
- [[Custos Operacionais]] — pertencem ao restaurante
- [[Planos — Assinatura]] — vinculada ao restaurante
