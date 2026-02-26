import { query } from './db'

/**
 * Get the list of department IDs a user is assigned to
 * Useful for Department Admin (role_id = 3) users
 */
export async function getUserDepartments(userId: string): Promise<string[]> {
  try {
    const result = await query(
      `SELECT dept_id FROM user_departments WHERE user_id = $1 ORDER BY dept_id ASC`,
      [String(userId)],
    )
    return result.rows.map((row) => row.dept_id)
  } catch (err) {
    console.error('Failed to fetch user departments:', err)
    return []
  }
}

/**
 * Check if a user has access to a specific artifact/document
 * Department Admin (role_id = 3) can only access:
 * - Documents in their assigned departments
 * - Unassigned documents (documents with no department)
 */
export async function canAccessDocument(userId: string, userRole: number, documentId: string, orgId: string): Promise<boolean> {
  if (userRole === 0) {
    // Superadmin can access all documents
    return true
  }

  if (userRole !== 3) {
    // Non-Department Admin users can access all documents in their org
    // (assumed access control is handled elsewhere)
    return true
  }

  // Department Admin access check
  try {
    const userDeptIds = await getUserDepartments(userId)

    if (userDeptIds.length === 0) {
      // Department Admin with no departments can only access unassigned documents
      const result = await query(
        `SELECT 1 FROM organization_documents d
         WHERE d.id = $1 AND d.org_id = $2
         AND NOT EXISTS (
           SELECT 1 FROM document_departments dd WHERE dd.document_id = d.id
         )`,
        [documentId, orgId],
      )
      return result.rows.length > 0
    }

    // Check if document is in user's departments or is unassigned
    const result = await query(
      `SELECT 1 FROM organization_documents d
       WHERE d.id = $1 AND d.org_id = $2 AND (
         NOT EXISTS (
           SELECT 1 FROM document_departments dd WHERE dd.document_id = d.id
         )
         OR EXISTS (
           SELECT 1 FROM document_departments dd WHERE dd.document_id = d.id AND dd.dept_id = ANY($3)
         )
       )`,
      [documentId, orgId, userDeptIds],
    )
    return result.rows.length > 0
  } catch (err) {
    console.error('Error checking document access:', err)
    return false
  }
}

/**
 * Build a WHERE clause filter for documents based on user role and departments
 * Returns object with filterClause and queryParams to be appended to queries
 */
export async function buildDocumentAccessFilter(userId: string, userRole: number): Promise<{
  filterClause: string
  queryParams: any[]
}> {
  if (userRole === 0 || userRole !== 3) {
    // Superadmin or non-Department Admin users don't need filtering
    return {
      filterClause: '',
      queryParams: [],
    }
  }

  // Department Admin filter
  const userDeptIds = await getUserDepartments(userId)

  if (userDeptIds.length === 0) {
    // No departments assigned - can only access unassigned documents
    return {
      filterClause: `AND NOT EXISTS (
        SELECT 1 FROM document_departments dd WHERE dd.document_id = d.id
      )`,
      queryParams: [],
    }
  }

  // Can access documents in their departments + unassigned documents
  return {
    filterClause: `AND (
      NOT EXISTS (
        SELECT 1 FROM document_departments dd WHERE dd.document_id = d.id
      )
      OR EXISTS (
        SELECT 1 FROM document_departments dd WHERE dd.document_id = d.id AND dd.dept_id = ANY($INDEX)
      )
    )`,
    queryParams: [userDeptIds],
  }
}

/**
 * Build a WHERE clause filter for users based on Department Admin role
 * Department Admin (role_id = 3) can see:
 * - Users in their assigned departments
 * - Unassigned users (users not in any department)
 */
export async function buildUserAccessFilter(userId: string, userRole: number): Promise<{
  filterClause: string
  queryParams: any[]
}> {
  if (userRole === 0 || userRole !== 3) {
    // Superadmin or non-Department Admin don't need filtering
    return {
      filterClause: '',
      queryParams: [],
    }
  }

  // Department Admin filter
  const userDeptIds = await getUserDepartments(userId)

  if (userDeptIds.length === 0) {
    // No departments - can only see unassigned users
    return {
      filterClause: `AND NOT EXISTS (
        SELECT 1 FROM user_departments ud WHERE ud.user_id = u.user_id
      )`,
      queryParams: [],
    }
  }

  // Can see users in their departments + unassigned users
  return {
    filterClause: `AND (
      NOT EXISTS (
        SELECT 1 FROM user_departments ud WHERE ud.user_id = u.user_id
      )
      OR EXISTS (
        SELECT 1 FROM user_departments ud WHERE ud.user_id = u.user_id AND ud.dept_id = ANY($INDEX)
      )
    )`,
    queryParams: [userDeptIds],
  }
}
