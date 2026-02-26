-- Migration: convert plan_id column on chargebee_orders from uuid to text
-- Allows storing non-UUID plan identifiers coming from external systems

BEGIN;

-- If column exists, alter its type to text (safe cast to text)
ALTER TABLE IF EXISTS public.chargebee_orders
  ALTER COLUMN plan_id DROP DEFAULT,
  ALTER COLUMN plan_id TYPE text USING plan_id::text;

COMMIT;
