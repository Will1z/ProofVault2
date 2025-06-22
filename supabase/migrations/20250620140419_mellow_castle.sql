/*
  # Fix Database Migration - Handle Existing Policies

  1. Safe Migration
    - Drop existing policies if they exist
    - Recreate all policies with proper permissions
    - Handle existing tables and indexes safely

  2. Security
    - Ensure RLS is enabled on all tables
    - Recreate policies for authenticated users
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for proof_records
  DROP POLICY IF EXISTS "Users can read all proof records" ON proof_records;
  DROP POLICY IF EXISTS "Users can insert their own proof records" ON proof_records;
  DROP POLICY IF EXISTS "Users can update their own proof records" ON proof_records;
  
  -- Drop policies for emergency_reports
  DROP POLICY IF EXISTS "Users can read all emergency reports" ON emergency_reports;
  DROP POLICY IF EXISTS "Users can insert emergency reports" ON emergency_reports;
  DROP POLICY IF EXISTS "Users can update emergency reports" ON emergency_reports;
  
  -- Drop policies for responders
  DROP POLICY IF EXISTS "Users can read all responders" ON responders;
  DROP POLICY IF EXISTS "Users can insert responder profiles" ON responders;
  DROP POLICY IF EXISTS "Users can update their responder profile" ON responders;
  
  -- Drop policies for chat_messages
  DROP POLICY IF EXISTS "Users can read all chat messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can insert chat messages" ON chat_messages;
  
  -- Drop policies for verification_reports
  DROP POLICY IF EXISTS "Users can read all verification reports" ON verification_reports;
  DROP POLICY IF EXISTS "Users can insert verification reports" ON verification_reports;
  DROP POLICY IF EXISTS "Users can update verification reports" ON verification_reports;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Table doesn't exist, continue
  WHEN undefined_object THEN
    NULL; -- Policy doesn't exist, continue
END $$;

-- Ensure tables exist (create if not exists)
CREATE TABLE IF NOT EXISTS proof_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_hash text NOT NULL UNIQUE,
  ipfs_hash text NOT NULL,
  summary text NOT NULL,
  transcript text,
  algorand_tx_id text NOT NULL,
  upload_date timestamptz NOT NULL,
  wallet_address text NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location_lat decimal NOT NULL,
  location_lng decimal NOT NULL,
  location_address text,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'closed')),
  timestamp timestamptz NOT NULL,
  reporter_id text,
  is_anonymous boolean DEFAULT false,
  urgency_score integer NOT NULL CHECK (urgency_score >= 1 AND urgency_score <= 10),
  chat_thread_id text NOT NULL UNIQUE,
  proof_hash text NOT NULL,
  ipfs_hash text,
  algorand_tx_id text,
  ai_suggestions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  location_lat decimal,
  location_lng decimal,
  is_available boolean DEFAULT true,
  skills text[] DEFAULT '{}',
  verification_code text NOT NULL,
  is_verified boolean DEFAULT false,
  contact_phone text,
  contact_radio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id text NOT NULL,
  sender_id text NOT NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL,
  content text NOT NULL,
  timestamp timestamptz NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'location', 'media')),
  media_url text,
  is_system_message boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id text NOT NULL,
  deepfake_confidence decimal,
  deepfake_risk_level text,
  metadata jsonb NOT NULL,
  transcription jsonb,
  ai_analysis jsonb NOT NULL,
  co_signatures jsonb[] DEFAULT '{}',
  overall_trust_score integer NOT NULL CHECK (overall_trust_score >= 0 AND overall_trust_score <= 100),
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed', 'flagged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE proof_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;

-- Recreate policies for proof_records
CREATE POLICY "Users can read all proof records"
  ON proof_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own proof records"
  ON proof_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own proof records"
  ON proof_records
  FOR UPDATE
  TO authenticated
  USING (true);

-- Recreate policies for emergency_reports
CREATE POLICY "Users can read all emergency reports"
  ON emergency_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert emergency reports"
  ON emergency_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update emergency reports"
  ON emergency_reports
  FOR UPDATE
  TO authenticated
  USING (true);

-- Recreate policies for responders
CREATE POLICY "Users can read all responders"
  ON responders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert responder profiles"
  ON responders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their responder profile"
  ON responders
  FOR UPDATE
  TO authenticated
  USING (true);

-- Recreate policies for chat_messages
CREATE POLICY "Users can read all chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recreate policies for verification_reports
CREATE POLICY "Users can read all verification reports"
  ON verification_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert verification reports"
  ON verification_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update verification reports"
  ON verification_reports
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_proof_records_wallet_address ON proof_records(wallet_address);
CREATE INDEX IF NOT EXISTS idx_proof_records_status ON proof_records(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_severity ON emergency_reports(severity);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_responders_is_available ON responders(is_available);
CREATE INDEX IF NOT EXISTS idx_verification_reports_file_id ON verification_reports(file_id);

-- Create or replace function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist and recreate them
DROP TRIGGER IF EXISTS update_proof_records_updated_at ON proof_records;
DROP TRIGGER IF EXISTS update_emergency_reports_updated_at ON emergency_reports;
DROP TRIGGER IF EXISTS update_responders_updated_at ON responders;
DROP TRIGGER IF EXISTS update_verification_reports_updated_at ON verification_reports;

-- Recreate triggers for updated_at
CREATE TRIGGER update_proof_records_updated_at
  BEFORE UPDATE ON proof_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_reports_updated_at
  BEFORE UPDATE ON emergency_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responders_updated_at
  BEFORE UPDATE ON responders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_reports_updated_at
  BEFORE UPDATE ON verification_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();