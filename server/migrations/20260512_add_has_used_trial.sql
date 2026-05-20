-- Add has_used_trial flag to prevent repeated trials
-- This is a permanent history flag: once true, never false again
ALTER TABLE IF EXISTS public.organizations
ADD COLUMN IF NOT EXISTS has_used_trial boolean DEFAULT false;
