import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const categoryId = getRouterParam(event, 'id')
  const config = useRuntimeConfig()

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Determine caller org/role and allow superadmin override via query param
  let tokenUserOrg: any
  let tokenUserRole: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    const userId = decodedToken.user_id
    const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }
    tokenUserOrg = userRow.rows[0].org_id
    tokenUserRole = userRow.rows[0].role_id
  } catch (error) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  if (!categoryId) {
    setResponseStatus(event, 400)
    throw new CustomError('Please provide a valid category ID', 400)
  }

  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  const effectiveOrg = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

  try {
    // First, check if category exists and belongs to the user's organization
    const categoryCheck = await query(
      `SELECT id, name FROM document_category WHERE id = $1 AND org_id = $2`,
      [categoryId, effectiveOrg]
    )

    if (categoryCheck.rows.length === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('Category not found or access denied', 404)
    }

    // Check if category is being used by any documents
    const usageCheck = await query(
      `SELECT COUNT(*) as count FROM organization_documents WHERE file_category = $1 AND org_id = $2`,
      [categoryCheck.rows[0].name, effectiveOrg]
    )

    if (parseInt(usageCheck.rows[0].count) > 0) {
      setResponseStatus(event, 409)
      throw new CustomError('Cannot delete category: it is being used by existing documents', 409)
    }

    // Delete the category
    const deleteCategoryQuery = `
      DELETE FROM document_category 
      WHERE id = $1 AND org_id = $2 
      RETURNING id;
    `
    const result = await query(deleteCategoryQuery, [categoryId, effectiveOrg])

    if (result.rowCount === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('Category not found or unauthorized', 404)
    }

    setResponseStatus(event, 204)
    return null // No content on success
  } catch (err: any) {
    if (err instanceof CustomError) {
      throw err
    }
    setResponseStatus(event, 500)
    throw new CustomError('Error deleting category', 500)
  }
})
