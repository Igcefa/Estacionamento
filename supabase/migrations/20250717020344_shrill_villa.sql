/*
  # Insert Test Users Directly

  1. Users Created
    - Admin: admin@parking.com / admin123 (administrator)
    - Gerente: gerente@parking.com / gerente123 (manager)  
    - Operador: operador@parking.com / operador123 (operator)

  2. Security
    - All users are active by default
    - Proper roles assigned
    - Created timestamps set to now()
*/

-- Insert test users directly into the users table
INSERT INTO users (id, username, password, role, name, is_active, created_at) VALUES
  ('admin-001', 'admin@parking.com', 'admin123', 'administrator', 'Administrador', true, now()),
  ('gerente-001', 'gerente@parking.com', 'gerente123', 'manager', 'Gerente', true, now()),
  ('operador-001', 'operador@parking.com', 'operador123', 'operator', 'Operador', true, now())
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;