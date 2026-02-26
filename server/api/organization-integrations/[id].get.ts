import { defineEventHandler, setResponseStatus, getRouterParam } from 'h3'
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

  let userId: string
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: string }).user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    // Get user's organization
    const userOrgRow = await query('SELECT org_id FROM users WHERE user_id = $1', [userId])
    if (!userOrgRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or organization not assigned', 404)
    }

    const orgId = userOrgRow.rows[0].org_id
    const integrationId = getRouterParam(event, 'id')

    if (!integrationId) {
      setResponseStatus(event, 400)
      throw new CustomError('Integration ID is required', 400)
    }

    // Fetch integration with related data
    const result = await query(
      `SELECT
        oi.id,
        oi.organization_id,
        oi.provider_id,
        oi.agent_id,
        oi.module_id,
        oi.connection_name,
        oi.client_id,
        oi.client_secret,
        oi.api_key,
        oi.access_token,
        oi.refresh_token,
        oi.token_expiry,
        oi.base_url,
        oi.login_url,
        oi.metadata_json,
        oi.status,
        oi.created_at,
        oi.updated_at,
        ip.name as provider_name,
        ip.code as provider_code,
        ia.name as agent_name,
        ia.code as agent_code,
        im.name as module_name,
        im.code as module_code
      FROM public.organization_integrations oi
      LEFT JOIN public.integration_providers ip ON oi.provider_id = ip.id
      LEFT JOIN public.integration_agents ia ON oi.agent_id = ia.id
      LEFT JOIN public.integration_modules im ON oi.module_id = im.id
      WHERE oi.id = $1 AND oi.organization_id = $2`,
      [integrationId, orgId]
    )

    if (!result.rowCount) {
      setResponseStatus(event, 404)
      throw new CustomError('Integration not found', 404)
    }

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: result.rows[0],
      message: 'Organization integration fetched successfully'
    }
  } catch (error: any) {
    console.error('Organization Integration Get Error:', error)

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
      message: 'Failed to fetch organization integration'
    }
  }
})
