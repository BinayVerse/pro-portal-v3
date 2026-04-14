-- Migration: Add is_system column to organization_departments
-- Marks departments as system-wide (non-editable, non-deletable)
-- Used to identify the "Common" department

BEGIN;

-- Add is_system column if it doesn't exist
ALTER TABLE IF EXISTS public.organization_departments
  ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Add comment to clarify purpose
COMMENT ON COLUMN public.organization_departments.is_system IS 'Marks system-managed departments (e.g., Common) that cannot be edited or deleted';

COMMIT;
