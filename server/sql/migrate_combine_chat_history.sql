-- Migration: combine chat_history user+assistant rows into single interaction rows
-- WARNING: Review and backup your data before running. Run within a transaction if desired.

BEGIN;

-- Ensure uuid extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a new table to hold combined interactions
CREATE TABLE IF NOT EXISTS chat_history_combined (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  org_id varchar(255),
  chat_id varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'interaction',
  message jsonb NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- Indexes to match original table
CREATE INDEX IF NOT EXISTS idx_chat_history_combined_user_id ON chat_history_combined (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_combined_org_id ON chat_history_combined (org_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_combined_chat_id ON chat_history_combined (chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_combined_created_at ON chat_history_combined (created_at DESC);

-- Step 1: Pair user and assistant rows by their ordinal position within each chat_id
WITH users AS (
  SELECT *, row_number() OVER (PARTITION BY chat_id ORDER BY created_at) AS u_idx
  FROM chat_history
  WHERE role = 'user'
), assistants AS (
  SELECT *, row_number() OVER (PARTITION BY chat_id ORDER BY created_at) AS a_idx
  FROM chat_history
  WHERE role = 'assistant'
), paired AS (
  SELECT
    u.user_id AS user_id,
    COALESCE(u.org_id, a.org_id) AS org_id,
    u.chat_id AS chat_id,
    u.created_at AS created_at,
    u.message  AS user_message,
    a.message  AS assistant_message,
    COALESCE(u.metadata, a.metadata, '{}'::jsonb) AS metadata
  FROM users u
  LEFT JOIN assistants a
    ON u.chat_id = a.chat_id AND u.u_idx = a.a_idx
)
INSERT INTO chat_history_combined (user_id, org_id, chat_id, role, message, metadata, created_at)
SELECT
  p.user_id,
  p.org_id,
  p.chat_id,
  'interaction' AS role,
  jsonb_build_object('user', p.user_message, 'assistant', p.assistant_message) AS message,
  p.metadata,
  p.created_at
FROM paired p;

-- Step 2: Insert assistant-only rows that weren't paired (assistants with no corresponding user index)
WITH assistants AS (
  SELECT *, row_number() OVER (PARTITION BY chat_id ORDER BY created_at) AS a_idx
  FROM chat_history
  WHERE role = 'assistant'
), users AS (
  SELECT chat_id, row_number() OVER (PARTITION BY chat_id ORDER BY created_at) AS u_idx
  FROM chat_history
  WHERE role = 'user'
), unpaired_assistants AS (
  SELECT a.*
  FROM assistants a
  LEFT JOIN users u ON a.chat_id = u.chat_id AND a.a_idx = u.u_idx
  WHERE u.u_idx IS NULL
)
INSERT INTO chat_history_combined (user_id, org_id, chat_id, role, message, metadata, created_at)
SELECT
  COALESCE(a.user_id, '')::varchar(255) AS user_id,
  a.org_id,
  a.chat_id,
  'interaction' AS role,
  jsonb_build_object('user', NULL, 'assistant', a.message) AS message,
  COALESCE(a.metadata, '{}'::jsonb) AS metadata,
  a.created_at
FROM unpaired_assistants a;

-- Step 3: Insert user-only rows that weren't paired (users with no corresponding assistant index)
WITH users AS (
  SELECT *, row_number() OVER (PARTITION BY chat_id ORDER BY created_at) AS u_idx
  FROM chat_history
  WHERE role = 'user'
), assistants AS (
  SELECT chat_id, row_number() OVER (PARTITION BY chat_id ORDER BY created_at) AS a_idx
  FROM chat_history
  WHERE role = 'assistant'
), unpaired_users AS (
  SELECT u.*
  FROM users u
  LEFT JOIN assistants a ON u.chat_id = a.chat_id AND u.u_idx = a.a_idx
  WHERE a.a_idx IS NULL
)
INSERT INTO chat_history_combined (user_id, org_id, chat_id, role, message, metadata, created_at)
SELECT
  u.user_id,
  u.org_id,
  u.chat_id,
  'interaction' AS role,
  jsonb_build_object('user', u.message, 'assistant', NULL) AS message,
  COALESCE(u.metadata, '{}'::jsonb) AS metadata,
  u.created_at
FROM unpaired_users u;

-- Optional: keep original table as backup
ALTER TABLE IF EXISTS chat_history RENAME TO chat_history_backup;

-- Rename new combined table to chat_history
ALTER TABLE chat_history_combined RENAME TO chat_history;

COMMIT;

-- After running: verify data and optionally drop chat_history_backup when satisfied.
-- Note: This migration pairs messages by their ordinal position within a chat. For more complex pairing (e.g. based on timestamps or custom heuristics), adapt the pairing logic as needed.
