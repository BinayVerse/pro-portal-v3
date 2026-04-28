-- Migration: Insert "Common" department for all orgs and map orphan artifacts
-- Creates the "Common" department as a system-managed department for all organizations
-- Maps artifacts without any department assignment to the "Common" department

BEGIN;

-- 1. Create "Common" department for each organization
WITH org_list AS (
  SELECT DISTINCT org_id FROM public.organization_departments
  UNION
  SELECT org_id FROM public.organizations
)
INSERT INTO public.organization_departments (org_id, name, description, status, is_system, created_by, created_at, updated_at)
SELECT 
  o.org_id,
  'Common',
  'Default system department for managing common users and artifacts.',
  'active',
  true,
  'system',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM org_list o
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_departments 
  WHERE org_id = o.org_id AND lower(name) = 'common'
)
ON CONFLICT DO NOTHING;

-- 2. Map orphan artifacts (documents without any department mapping) to "Common"
-- Find all documents that don't have any department assignment and link them to Common
WITH orphan_docs AS (
  SELECT DISTINCT od.id, od.org_id
  FROM public.organization_documents od
  LEFT JOIN public.document_departments dd ON dd.document_id = od.id
  WHERE dd.document_id IS NULL  -- No department mapping exists
),
common_depts AS (
  SELECT dept_id, org_id
  FROM public.organization_departments
  WHERE lower(name) = 'common' AND is_system = true
)
INSERT INTO public.document_departments (document_id, dept_id, org_id, created_at)
SELECT od.id, cd.dept_id, od.org_id, CURRENT_TIMESTAMP
FROM orphan_docs od
JOIN common_depts cd ON cd.org_id = od.org_id
ON CONFLICT (document_id, dept_id) DO NOTHING;

COMMIT;
