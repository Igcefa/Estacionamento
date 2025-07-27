/*
  # Create Simple Users for Login

  1. New Tables
    - Ensures `users` table exists with correct structure
    - Inserts test users with plain passwords for development
  
  2. Test Users
    - admin@parking.com / admin123 (administrator)
    - gerente@parking.com / gerente123 (manager) 
    - operador@parking.com / operador123 (operator)
  
  3. Security
    - Enable RLS on users table
    - Allow all operations for authenticated users
    - Allow reading for login verification
*/

-- Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('administrator', 'manager', 'operator')),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  auth_id uuid
);

-- Clear existing users and insert fresh test users
DELETE FROM users;

INSERT INTO users (id, username, password, role, name, is_active) VALUES
  ('admin-001', 'admin@parking.com', 'admin123', 'administrator', 'Administrador', true),
  ('manager-001', 'gerente@parking.com', 'gerente123', 'manager', 'Gerente', true),
  ('operator-001', 'operador@parking.com', 'operador123', 'operator', 'Operador', true);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow reading user profiles for login" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Allow login verification" ON users;

-- Create permissive policy for development
CREATE POLICY "Allow login verification" ON users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);