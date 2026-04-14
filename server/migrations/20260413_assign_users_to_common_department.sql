-- Migration: Map orphan users to "Common" department
-- Assigns users who don't have any department assignment to the "Common" system department
-- Ensures all users have at least one department for consistency with artifact handling

BEGIN;

-- Map orphan users (without any department assignment) to "Common" department
WITH orphan_users AS (
  SELECT DISTINCT u.user_id, u.org_id
  FROM public.users u
  LEFT JOIN public.user_departments ud ON ud.user_id = u.user_id
  WHERE ud.user_id IS NULL  -- No department assignment exists
),
common_depts AS (
  SELECT dept_id, org_id
  FROM public.organization_departments
  WHERE lower(name) = 'common' AND is_system = true
)
INSERT INTO public.user_departments (user_id, dept_id, org_id, created_at)
SELECT ou.user_id, cd.dept_id, ou.org_id, CURRENT_TIMESTAMP
FROM orphan_users ou
JOIN common_depts cd ON cd.org_id = ou.org_id
ON CONFLICT (user_id, dept_id) DO NOTHING;

COMMIT;
