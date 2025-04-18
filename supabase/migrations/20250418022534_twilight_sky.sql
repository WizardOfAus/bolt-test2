/*
  # Update admin users configuration

  1. Changes
    - Ensure admin_users table exists
    - Safely handle RLS policy creation
    - Add admin email if not exists

  2. Security
    - Enable RLS on admin_users table
    - Add policy for authenticated users to check their admin status
*/

-- Create the admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Safely create the policy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'admin_users' 
          AND policyname = 'Users can check if they are admin'
    ) THEN
        CREATE POLICY "Users can check if they are admin"
          ON admin_users
          FOR SELECT
          TO authenticated
          USING ((auth.jwt() ->> 'email'::text) = email);
    END IF;
END
$$;

-- Insert admin email if it doesn't exist
INSERT INTO admin_users (email)
VALUES ('helpfuldyz@gmail.com')
ON CONFLICT (email) DO NOTHING;