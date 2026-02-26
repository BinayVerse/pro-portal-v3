import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import { query } from '../utils/db'
import { CustomError } from '../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  try {
    jwt.verify(token, config.jwtToken as string)
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    const q = getQuery(event) as Record<string, any>
    const agentId = q?.agent_id
    const moduleId = q?.module_id

    if (!agentId) {
      setResponseStatus(event, 400)
      throw new CustomError('agent_id is required', 400)
    }

    let sql = `
      SELECT DISTINCT p.id, p.name, p.code, p.description, p.is_active, p.created_at, p.updated_at
      FROM public.integration_providers p
      INNER JOIN public.integration_agent_providers aap ON p.id = aap.provider_id
      WHERE aap.agent_id = $1
      AND p.is_active = true
    `
    const params: any[] = [agentId]

    // If moduleId is provided, also filter by providers that support this module
    if (moduleId) {
      sql += ` AND p.id IN (
        SELECT provider_id FROM public.integration_provider_modules 
        WHERE module_id = $2
      )`
      params.push(moduleId)
    }

    sql += ` ORDER BY p.name ASC`

    const result = await query(sql, params)

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: result.rows,
      message: 'Integration providers fetched successfully for agent'
    }
  } catch (error: any) {
    console.error('Integration Providers By Agent Error:', error)

    if (error instanceof CustomError) {
      setResponseStatus(event, error.statusCode)
      return {
        statusCode: error.statusCode,
        status: 'error',
        message: error.message
      }
    }

    setResponseStatus(event, 500)
    return {
      statusCode: 500,
      status: 'error',
      message: 'Failed to fetch integration providers'
    }
  }
})
