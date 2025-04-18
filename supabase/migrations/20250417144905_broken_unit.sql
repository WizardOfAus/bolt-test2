/*
  # Create document access table

  1. New Tables
    - `document_access`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `accessed_at` (timestamptz, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `document_access` table
    - Add policy for authenticated users to read all records
    - Add policy for anyone to insert records (needed for guest document access)
*/

CREATE TABLE IF NOT EXISTS document_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  accessed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_access ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all records
CREATE POLICY "Allow authenticated users to read all records"
  ON document_access
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anyone to insert records (needed for guest document access)
CREATE POLICY "Allow anyone to insert records"
  ON document_access
  FOR INSERT
  TO public
  WITH CHECK (true);