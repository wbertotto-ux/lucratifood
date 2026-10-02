# Supabase — Banco de Dados

Projeto: `djbtiipoymmwurvrnhfj.supabase.co`  
Migrations: `supabase/migrations/`

## Hierarquia das tabelas

```
users (Supabase Auth)
└── restaurantes          ← criado no [[Onboarding]]
    ├── insumos           ← [[Insumos]]
    │   └── historico_precos
    ├── receitas          ← [[Receitas — Fichas Técnicas]]
    │   ├── itens_receita
    │   └── precos_canal  ← [[Canais de Venda]]
    ├── canais_venda      ← [[Canais de Venda]]
    ├── categorias_insumo ← [[Configurações]]
    ├── custos_operacionais ← [[Custos Operacionais]]
    └── assinaturas       ← [[Planos — Assinatura]]

planos                    ← tabela de referência (Essencial, PRO)
```

## RLS (Row Level Security)

Todas as tabelas filhas de `restaurantes` têm políticas que verificam:
```sql
restaurante_id IN (
  SELECT id FROM restaurantes WHERE dono_id = auth.uid()
)
```

## Constraints importantes

- `precos_canal`: UNIQUE `(receita_id, canal_id)` — permite UPSERT sem duplicar
- `itens_receita`: CHECK que exige insumo_id OU sub_receita_id (não ambos, não nenhum)
- `insumos.categoria_id`: FK com `ON DELETE SET NULL` — excluir categoria não apaga insumos

## Conectado a

- [[Restaurante]] — raiz da hierarquia
- [[Supabase — Auth]] — mesmo projeto, contexto de usuário via RLS
- Todos os módulos do app — cada módulo lê/escreve suas tabelas
