-- Seed executado após migration em ambiente local

-- Usuário de teste universal (criado via supabase db reset)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'wbertotto@gmail.com',
  crypt('will04', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Os dados reais são criados pelo onboarding do usuário.
-- Este seed apenas documenta os dados padrão criados pelo onboarding.

-- Categorias padrão criadas automaticamente no onboarding:
-- 'Hortifrúti', 'Carnes', 'Laticínios', 'Secos e Grãos',
-- 'Bebidas', 'Embalagens', 'Limpeza e Descartáveis', 'Outros'

-- Canais padrão criados automaticamente no onboarding:
-- 'Salão'     pct_comissao=0
-- 'iFood'     pct_comissao=0.23
-- 'WhatsApp'  pct_comissao=0
