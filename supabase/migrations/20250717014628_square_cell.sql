/*
  # Setup Supabase Authentication Users

  1. Create users in Supabase Auth system
  2. Link auth users to custom users table
  3. Setup proper authentication flow

  This migration creates the proper auth users and links them to our custom user profiles.
*/

-- First, let's update our users table to link with Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- When a new auth user is created, create corresponding profile
  INSERT INTO public.users (auth_id, username, name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'username'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

-- Allow reading user profiles for login
CREATE POLICY "Allow reading user profiles for login"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);