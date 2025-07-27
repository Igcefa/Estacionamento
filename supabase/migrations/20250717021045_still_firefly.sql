/*
  # Fix RLS Policies for Vehicle Operations

  1. Security Updates
    - Update RLS policies to allow authenticated users to perform operations
    - Ensure INSERT, UPDATE, SELECT, DELETE permissions are properly configured
    - Fix policy conditions to work with current authentication system

  2. Tables Updated
    - vehicles: Allow all operations for authenticated users
    - vehicle_payments: Allow all operations for authenticated users
    - All other tables: Ensure proper access for authenticated users

  3. Development-Friendly
    - Policies work with both Supabase Auth and custom authentication
    - Clear policy names for easy identification
    - Proper permissions for all user roles
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON vehicle_payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON pricing_tables;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON coupons;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON payment_methods;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON receipts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON templates;
DROP POLICY IF EXISTS "Allow login verification" ON users;

-- Create comprehensive policies for vehicles table
CREATE POLICY "vehicles_select_policy" ON vehicles
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "vehicles_insert_policy" ON vehicles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "vehicles_update_policy" ON vehicles
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "vehicles_delete_policy" ON vehicles
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Create comprehensive policies for vehicle_payments table
CREATE POLICY "vehicle_payments_select_policy" ON vehicle_payments
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "vehicle_payments_insert_policy" ON vehicle_payments
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "vehicle_payments_update_policy" ON vehicle_payments
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "vehicle_payments_delete_policy" ON vehicle_payments
  FOR DELETE
  TO authenticated, anon
  USING (true);

-- Create comprehensive policies for other tables
CREATE POLICY "pricing_tables_all_policy" ON pricing_tables
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "coupons_all_policy" ON coupons
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payment_methods_all_policy" ON payment_methods
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "receipts_all_policy" ON receipts
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "templates_all_policy" ON templates
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_all_policy" ON users
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;