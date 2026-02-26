BEGIN;

-- Remove tax_number column from billing_address table
ALTER TABLE IF EXISTS public.billing_address
    DROP COLUMN IF EXISTS tax_number;

-- Remove tax_number column from organizations table (deprecated in favor of org_tax_id)
ALTER TABLE IF EXISTS public.organizations
    DROP COLUMN IF EXISTS tax_number;

COMMIT;
