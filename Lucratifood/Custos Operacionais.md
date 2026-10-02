# Custos Operacionais

Tabela: `custos_operacionais`  
Gerenciados em [[Configurações]]

Gastos mensais fixos e variáveis da operação (aluguel, energia, gás, funcionários, etc.). O sistema distribui o total por porção produzida.

## Cálculo de rateio

```
custo_op_por_porcao = soma(custos_ativos) / porcoes_mes_estimado
```

Esse valor é **somado ao custo de ingredientes** de cada prato no [[Dashboard — Painel]] e na [[Engine de Cálculo]].

## Configuração

- Categoria: Energia, Gás, Funcionários, Aluguel, Manutenção, Marketing, Contabilidade, Outros
- Descrição + valor mensal
- Porções estimadas/mês: configurável em [[Configurações]]

## Conectado a

- [[Configurações]] — CRUD feito aqui
- [[Engine de Cálculo]] — custo por porção entra no custo total
- [[Dashboard — Painel]] — banner mostra custo operacional por porção
- [[Restaurante]] — `porcoes_mes_estimado` salvo no restaurante
