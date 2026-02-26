import { defineEventHandler, setResponseStatus } from 'h3'
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
    // Fetch agent-module relationships
    const agentModulesResult = await query(
      `SELECT agent_id, module_id FROM public.integration_agent_modules`,
      []
    )

    // Fetch agent-provider relationships
    const agentProvidersResult = await query(
      `SELECT agent_id, provider_id FROM public.integration_agent_providers`,
      []
    )

    // Fetch provider-module relationships
    const providerModulesResult = await query(
      `SELECT provider_id, module_id FROM public.integration_provider_modules`,
      []
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: {
        agentModules: agentModulesResult.rows,
        agentProviders: agentProvidersResult.rows,
        providerModules: providerModulesResult.rows,
      },
      message: 'Integration relationships fetched successfully'
    }
  } catch (error: any) {
    console.error('Integration Relationships Error:', error)

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
      message: 'Failed to fetch integration relationships'
    }
  }
})
