import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { createOrganizationIntegration, createIntegrationAuditLog } from '../../utils/dbHelpers'

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

    // Read request body
    const body = await readBody(event)

    // Validate required fields
    const requiredFields = ['provider_id', 'agent_id', 'module_id', 'client_id']
    for (const field of requiredFields) {
      if (!body[field]) {
        setResponseStatus(event, 400)
        throw new CustomError(`Missing required field: ${field}`, 400)
      }
    }

    // Validate foreign key references
    const providerRes = await query('SELECT id FROM public.integration_providers WHERE id = $1', [body.provider_id])
    if (!providerRes.rowCount) {
      setResponseStatus(event, 404)
      throw new CustomError('Provider not found', 404)
    }

    const agentRes = await query('SELECT id FROM public.integration_agents WHERE id = $1', [body.agent_id])
    if (!agentRes.rowCount) {
      setResponseStatus(event, 404)
      throw new CustomError('Agent not found', 404)
    }

    const moduleRes = await query('SELECT id FROM public.integration_modules WHERE id = $1', [body.module_id])
    if (!moduleRes.rowCount) {
      setResponseStatus(event, 404)
      throw new CustomError('Module not found', 404)
    }

    // Create integration using helper function
    const integrationData = {
      client_id: body.client_id,
      client_secret: body.client_secret || null,
      api_key: body.api_key || null,
      access_token: body.access_token || null,
      refresh_token: body.refresh_token || null,
      token_expiry: body.token_expiry || null,
      base_url: body.base_url || null,
      login_url: body.login_url || null,
      metadata_json: body.metadata_json || {},
      status: body.status || 'active',
      hrms_system: body.hrms_system,
      is_hrms: body.is_hrms
    }

    const result = await createOrganizationIntegration(
      orgId,
      body.provider_id,
      body.agent_id,
      body.module_id,
      integrationData
    )

    if (!result.success) {
      setResponseStatus(event, 500)
      throw new CustomError(result.error || 'Failed to create integration', 500)
    }

    // Create audit log for creation
    await createIntegrationAuditLog(
      result.id!,
      orgId,
      'create',
      userId,
      event,
      undefined,
      integrationData
    )

    // Note: HRMS integration is already handled by createOrganizationIntegration helper function

    setResponseStatus(event, 201)
    return {
      statusCode: 201,
      status: 'success',
      data: { id: result.id },
      message: 'Organization integration created successfully'
    }
  } catch (error: any) {
    console.error('Organization Integration Create Error:', error)

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
      message: 'Failed to create organization integration'
    }
  }
})
