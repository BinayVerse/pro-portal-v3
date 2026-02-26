import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const artefactId = getRouterParam(event, 'id')
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let callerUserId: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    callerUserId = decodedToken.user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  if (!artefactId) {
    setResponseStatus(event, 400)
    throw new CustomError('Artifact ID is required', 400)
  }

  try {
    const result = await query(
      `SELECT dd.dept_id, od.name, od.description
       FROM document_departments dd
       JOIN organization_departments od ON od.dept_id = dd.dept_id
       WHERE dd.document_id = $1
       ORDER BY od.name ASC`,
      [String(artefactId)],
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      departments: result.rows.map((row) => ({
        dept_id: row.dept_id,
        name: row.name,
        description: row.description,
      })),
    }
  } catch (err: any) {
    console.error('Error fetching artifact departments:', err)
    setResponseStatus(event, 500)
    throw new CustomError('Failed to fetch artifact departments', 500)
  }
})
