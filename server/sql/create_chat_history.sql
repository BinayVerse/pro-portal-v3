-- Create extension for UUID generation (pgcrypto preferred)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table: chat_history

CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  org_id varchar(255),
  chat_id varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'user',
  message jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- Indexes to speed up common queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_org_id ON chat_history (org_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_chat_id ON chat_history (chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history (created_at DESC);

-- Note: If your Postgres does not have pgcrypto, you can use uuid-ossp:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- and change default to uuid_generate_v4() instead of gen_random_uuid().
