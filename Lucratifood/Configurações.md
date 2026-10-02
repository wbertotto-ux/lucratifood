# Configurações

`app/(app)/configuracoes/`  
`lib/actions/configuracoes.ts`

Painel de administração do negócio. Tudo que afeta os cálculos globalmente.

## Seções

### Dados do restaurante
- Nome, impostos (%), taxa de cartão (%), margem mínima (%)
- Alterações refletem imediatamente em [[Engine de Cálculo]] → [[Dashboard — Painel]]

### Canais de venda
- Criar, editar (nome + comissão) e ativar/desativar [[Canais de Venda]]
- Limite de 1 ativo no Essencial (conta apenas ativos)
- Erros de limite exibidos inline

### Categorias de insumo
- CRUD de categorias usadas em [[Insumos]]
- Exclusão bloqueada se houver insumos ativos vinculados (exibe contagem)

### Custos operacionais
- CRUD de custos fixos/variáveis mensais
- Porções estimadas/mês → custo por porção = total ÷ porções
- Custo por porção somado ao custo de ingredientes no [[Dashboard — Painel]]

## Conectado a

- [[Restaurante]] — parâmetros globais de cálculo
- [[Canais de Venda]] — gerenciados aqui
- [[Custos Operacionais]] — gerenciados aqui
- [[Insumos]] — categorias gerenciadas aqui
- [[Engine de Cálculo]] — alimentado pelos parâmetros daqui
- [[Planos — Assinatura]] — limita número de canais
