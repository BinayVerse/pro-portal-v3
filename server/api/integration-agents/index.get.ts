import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
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
    const result = await query(
      `SELECT id, name, code, created_at
       FROM public.integration_agents
       ORDER BY name ASC`,
      []
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: result.rows,
      message: 'Integration agents fetched successfully'
    }
  } catch (error: any) {
    console.error('Integration Agents Error:', error)

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
      message: 'Failed to fetch integration agents'
    }
  }
})
