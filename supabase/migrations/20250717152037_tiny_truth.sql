/*
  # Sistema de Clientes Especiais

  1. Nova Tabela - special_clients
    - `id` (text, primary key)
    - `name` (text, nome do cliente)
    - `document` (text, CPF/CNPJ)
    - `phone` (text, telefone)
    - `email` (text, email)
    - `pricing_table_id` (text, referência para pricing_tables)
    - `is_active` (boolean, cliente ativo)
    - `created_at` (timestamp)

  2. Modificação - coupons
    - Adicionar `special_pricing_table_id` (text, opcional)
    - Quando preenchido, o cupom concede acesso à tabela especial

  3. Modificação - vehicles
    - Adicionar `special_client_id` (text, opcional)
    - Para rastrear qual cliente especial usou o veículo

  4. Security
    - RLS habilitado em todas as tabelas
    - Políticas para CRUD operations
*/

-- Criar tabela de clientes especiais
CREATE TABLE IF NOT EXISTS special_clients (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  document text,
  phone text,
  email text,
  pricing_table_id text REFERENCES pricing_tables(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_special_clients_name ON special_clients(name);
CREATE INDEX IF NOT EXISTS idx_special_clients_document ON special_clients(document);
CREATE INDEX IF NOT EXISTS idx_special_clients_active ON special_clients(is_active);

-- Habilitar RLS
ALTER TABLE special_clients ENABLE ROW LEVEL SECURITY;

-- Políticas para special_clients
CREATE POLICY "special_clients_all_policy"
  ON special_clients
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Adicionar coluna para tabela especial nos cupons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'special_pricing_table_id'
  ) THEN
    ALTER TABLE coupons ADD COLUMN special_pricing_table_id text REFERENCES pricing_tables(id);
  END IF;
END $$;

-- Adicionar coluna para cliente especial nos veículos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'special_client_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN special_client_id text REFERENCES special_clients(id);
  END IF;
END $$;

-- Adicionar índices nas novas colunas
CREATE INDEX IF NOT EXISTS idx_coupons_special_pricing ON coupons(special_pricing_table_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_special_client ON vehicles(special_client_id);