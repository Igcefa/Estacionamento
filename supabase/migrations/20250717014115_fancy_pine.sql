/*
  # Fix Users Table and Authentication

  1. Recreate Users Table
    - Drop and recreate users table with proper structure
    - Insert default users with plain text passwords (for development)
    - Ensure proper constraints and indexes

  2. Security
    - Enable RLS on users table
    - Add policy for authenticated access
*/

-- Drop existing users table if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('administrator', 'manager', 'operator')),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default users with plain text passwords
INSERT INTO public.users (id, username, password, role, name, is_active) VALUES
  ('admin-001', 'admin', 'admin123', 'administrator', 'Administrador', true),
  ('manager-001', 'gerente', 'gerente123', 'manager', 'Gerente', true),
  ('operator-001', 'operador', 'operador123', 'operator', 'Operador', true);

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);