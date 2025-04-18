/*
  # Create documents table for PDF storage

  1. New Tables
    - `documents`
      - `id` (uuid, primary key) - Unique identifier for each document
      - `name` (text) - Original filename of the document
      - `file_path` (text) - Storage path of the document
      - `size` (bigint) - File size in bytes
      - `created_at` (timestamptz) - Timestamp when the document was uploaded

  2. Security
    - Enable RLS on `documents` table
    - Add policies for authenticated users to:
      - Read all documents
      - Insert new documents
      - Update documents
      - Delete documents
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  size bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all records
CREATE POLICY "Allow authenticated users to read all records"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert records"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update records
CREATE POLICY "Allow authenticated users to update records"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete records
CREATE POLICY "Allow authenticated users to delete records"
  ON documents
  FOR DELETE
  TO authenticated
  USING (true);