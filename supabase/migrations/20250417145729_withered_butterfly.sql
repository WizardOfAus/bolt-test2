/*
  # Create admin users table and policies

  1. New Tables
    - `admin_users`
      - `email` (text, primary key)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if they are an admin
CREATE POLICY "Users can check if they are admin"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Insert your admin email (replace with your actual email)
INSERT INTO admin_users (email) VALUES ('helpfuldyz@gmail.com')
ON CONFLICT (email) DO NOTHING;