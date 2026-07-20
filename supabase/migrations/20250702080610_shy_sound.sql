/*
  # Create WCST Results Table

  1. New Tables
    - `wcst_results`
      - `id` (uuid, primary key)
      - `participant_id` (text, optional identifier for participant)
      - `test_date` (date when test was taken)
      - `total_trials` (integer)
      - `total_correct` (integer)
      - `total_errors` (integer)
      - `categories_completed` (integer)
      - `trials_to_first_category` (integer, nullable)
      - `conceptual_level_responses` (integer)
      - `failure_to_maintain_set` (integer)
      - `perseverative_responses` (integer)
      - `perseverative_errors` (integer)
      - `nonperseverative_errors` (integer)
      - `percent_errors` (decimal)
      - `percent_perseverative_responses` (decimal)
      - `percent_perseverative_errors` (decimal)
      - `percent_nonperseverative_errors` (decimal)
      - `percent_conceptual_level_responses` (decimal)
      - `learning_to_learn` (decimal, nullable)
      - `raw_responses` (jsonb for storing detailed response data)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wcst_results` table
    - Add policy for public read/write access (adjust as needed for your use case)
*/

CREATE TABLE IF NOT EXISTS wcst_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id text,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  total_trials integer NOT NULL DEFAULT 0,
  total_correct integer NOT NULL DEFAULT 0,
  total_errors integer NOT NULL DEFAULT 0,
  categories_completed integer NOT NULL DEFAULT 0,
  trials_to_first_category integer,
  conceptual_level_responses integer NOT NULL DEFAULT 0,
  failure_to_maintain_set integer NOT NULL DEFAULT 0,
  perseverative_responses integer NOT NULL DEFAULT 0,
  perseverative_errors integer NOT NULL DEFAULT 0,
  nonperseverative_errors integer NOT NULL DEFAULT 0,
  percent_errors decimal(5,2) NOT NULL DEFAULT 0.00,
  percent_perseverative_responses decimal(5,2) NOT NULL DEFAULT 0.00,
  percent_perseverative_errors decimal(5,2) NOT NULL DEFAULT 0.00,
  percent_nonperseverative_errors decimal(5,2) NOT NULL DEFAULT 0.00,
  percent_conceptual_level_responses decimal(5,2) NOT NULL DEFAULT 0.00,
  learning_to_learn decimal(8,2),
  raw_responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wcst_results ENABLE ROW LEVEL SECURITY;

-- Allow public access for now - adjust based on your authentication needs
CREATE POLICY "Allow public read access to wcst_results"
  ON wcst_results
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to wcst_results"
  ON wcst_results
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_wcst_results_participant_id ON wcst_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_wcst_results_created_at ON wcst_results(created_at);