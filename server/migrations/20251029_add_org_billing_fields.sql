

BEGIN;

-- 1 Add the new GST number column
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50);

COMMIT;


CREATE TABLE IF NOT EXISTS public.billing_address
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    tax_number VARCHAR(50),
    address_line1 TEXT,
    address_line2 TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT,
    address_phone TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_billing_org
        FOREIGN KEY (org_id)
        REFERENCES public.organizations (org_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- rename chargebee table to subscription_details

BEGIN;

-- 1️⃣ Rename the table
ALTER TABLE IF EXISTS public.chargebee_orders
    RENAME TO subscription_details;

-- 2️⃣ Drop the hosted page columns (if they exist)
ALTER TABLE IF EXISTS public.subscription_details
    DROP COLUMN IF EXISTS hosted_page_id,
    DROP COLUMN IF EXISTS hosted_page_url;

-- 3️⃣ Add foreign key constraint to organizations(org_id)
ALTER TABLE IF EXISTS public.subscription_details
    ADD CONSTRAINT fk_subscription_org
    FOREIGN KEY (org_id)
    REFERENCES public.organizations (org_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

-- 4️⃣ (Optional) Rename indexes to match new table name for clarity
ALTER INDEX IF EXISTS chargebee_orders_hosted_page_id_idx RENAME TO subscription_details_hosted_page_id_idx;
ALTER INDEX IF EXISTS chargebee_orders_org_id_idx RENAME TO subscription_details_org_id_idx;

-- 5️⃣ (Optional) Rename trigger to follow new table name convention
ALTER TRIGGER set_timestamp_orders ON public.subscription_details
    RENAME TO set_timestamp_subscription_details;

COMMIT;
