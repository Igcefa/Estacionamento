/*
  # Create user sessions table for employee tracking

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (text, foreign key to users)
      - `login_time` (timestamptz)
      - `logout_time` (timestamptz, nullable)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policies for authenticated users to manage sessions

  3. Indexes
    - Index on user_id for faster queries
    - Index on login_time for date filtering
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id),
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sessions_select_policy"
  ON user_sessions
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "user_sessions_insert_policy"
  ON user_sessions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "user_sessions_update_policy"
  ON user_sessions
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time);
CREATE INDEX IF NOT EXISTS idx_user_sessions_logout_time ON user_sessions(logout_time);