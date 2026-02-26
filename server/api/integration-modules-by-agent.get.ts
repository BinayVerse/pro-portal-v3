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

    if (!agentId) {
      setResponseStatus(event, 400)
      throw new CustomError('agent_id is required', 400)
    }

    // Fetch modules for the specified agent via integration_agent_modules junction table
    const result = await query(
      `SELECT DISTINCT m.id, m.name, m.code, m.created_at
       FROM public.integration_modules m
       INNER JOIN public.integration_agent_modules aam ON m.id = aam.module_id
       WHERE aam.agent_id = $1
       ORDER BY m.name ASC`,
      [agentId]
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: result.rows,
      message: 'Integration modules fetched successfully for agent'
    }
  } catch (error: any) {
    console.error('Integration Modules By Agent Error:', error)

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
      message: 'Failed to fetch integration modules'
    }
  }
})
