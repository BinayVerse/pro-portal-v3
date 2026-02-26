-- Add Chargebee columns to organizations
ALTER TABLE IF EXISTS public.organizations
ADD COLUMN IF NOT EXISTS chargebee_customer_id text;

ALTER TABLE IF EXISTS public.organizations
ADD COLUMN IF NOT EXISTS chargebee_subscription_id text;

-- Create chargebee_orders to track hosted page sessions
CREATE TABLE IF NOT EXISTS public.chargebee_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id character varying(50) NOT NULL,
  plan_id text,
  hosted_page_id text,
  hosted_page_url text,
  status character varying(30) NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chargebee_orders_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS chargebee_orders_hosted_page_id_idx ON public.chargebee_orders (hosted_page_id);
CREATE INDEX IF NOT EXISTS chargebee_orders_org_id_idx ON public.chargebee_orders (org_id);

-- Add trigger to update updated_at for chargebee_orders
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp_orders()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_orders ON public.chargebee_orders;
CREATE TRIGGER set_timestamp_orders
  BEFORE UPDATE ON public.chargebee_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp_orders();
