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

    // Validate modules array
    if (!Array.isArray(body.modules) || body.modules.length === 0) {
      setResponseStatus(event, 400)
      throw new CustomError('modules array is required and must not be empty', 400)
    }

    // Validate required fields in payload
    const requiredFields = ['provider_id', 'agent_id', 'client_id']
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

    // Validate all modules exist and cast to string array
    const modules = body.modules as string[]
    for (const moduleId of modules) {
      const moduleRes = await query('SELECT id FROM public.integration_modules WHERE id = $1', [moduleId])
      if (!moduleRes.rowCount) {
        setResponseStatus(event, 400)
        throw new CustomError(`Module not found: ${moduleId}`, 400)
      }
    }

    // Common integration data for all modules
    const integrationData = {
      client_id: body.client_id,
      client_secret: body.client_secret || null,
      api_key: body.api_key || null,
      access_token: body.access_token || null,
      refresh_token: body.refresh_token || null,
      token_expiry: body.token_expiry || null,
      base_url: body.base_url || null,
      login_url: body.login_url || null,
      metadata_json: {
        login_url: body.login_url || null,
        base_url: body.base_url || null,
        api_key: body.api_key || null,
        ...(body.metadata_json || {})
      },
      status: body.status || 'active',
      hrms_system: body.hrms_system,
      is_hrms: body.is_hrms,
      module_ids: modules
    }

    // Create integrations for all modules
    const createdIds: string[] = []
    const errors: Array<{ moduleId: string; error: string }> = []

    for (const moduleId of modules) {
      try {
        // Check if this agent+module combination already exists for this provider
        const duplicateRes = await query(
          `SELECT id FROM public.organization_integrations
           WHERE organization_id = $1 AND provider_id = $2 AND agent_id = $3 AND module_id = $4`,
          [orgId, body.provider_id, body.agent_id, moduleId]
        )

        if (duplicateRes.rowCount > 0) {
          errors.push({
            moduleId: moduleId as string,
            error: 'This agent and module combination already exists for this provider'
          })
          continue
        }
        const result = await createOrganizationIntegration(
          orgId,
          body.provider_id,
          body.agent_id,
          moduleId,
          integrationData,
        )

        if (result.success && result.id) {
          const createdId = result.id as string
          createdIds.push(createdId)

          // Fetch created data for audit log
          const createdDataRes = await query(
            `SELECT
              id, provider_id, module_id, client_id, client_secret, api_key, access_token,
              refresh_token, token_expiry, base_url, login_url, metadata_json, status
             FROM public.organization_integrations WHERE id = $1`,
            [createdId]
          )

          const createdData = createdDataRes.rows[0] || integrationData

          // Create audit log for creation
          await createIntegrationAuditLog(
            createdId,
            orgId,
            'create',
            userId,
            event,
            undefined,
            createdData
          )
        } else {
          errors.push({ moduleId: moduleId as string, error: result.error || 'Failed to create integration' })
        }
      } catch (err: any) {
        errors.push({ moduleId: moduleId as string, error: err.message || 'Unknown error' })
      }
    }

    // If all failed, return error
    if (createdIds.length === 0) {
      setResponseStatus(event, 500)
      return {
        statusCode: 500,
        status: 'error',
        message: 'Failed to create any integrations',
        errors
      }
    }

    // If some failed, return partial success
    if (errors.length > 0) {
      setResponseStatus(event, 207) // Multi-Status
      return {
        statusCode: 207,
        status: 'partial_success',
        data: { ids: createdIds },
        message: `Created ${createdIds.length} out of ${body.modules.length} integrations`,
        errors
      }
    }

    // All succeeded
    setResponseStatus(event, 201)
    return {
      statusCode: 201,
      status: 'success',
      data: { ids: createdIds },
      message: `Integration(s) created successfully!`
    }
  } catch (error: any) {
    console.error('Organization Integration Batch Create Error:', error)

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
      message: 'Failed to create organization integrations'
    }
  }
})
