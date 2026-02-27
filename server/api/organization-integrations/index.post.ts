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

    // SYNC: Also create/update in hrms_integration table for backward compatibility
    if (body.hrms_system) {
      const hrmsMetadata = {
        deprecated: true,
        deprecated_note: 'This table is deprecated. Use organization_integrations instead.',
        provider_id: body.provider_id,
        agent_id: body.agent_id,
        module_id: body.module_id,
        api_key: body.api_key,
        login_url: body.login_url,
        organization_integration_id: result.id,
      }

      // Check if hrms_integration already exists
      const existingHrms = await query(
        'SELECT id FROM public.hrms_integration WHERE organization_id = $1 AND hrms_system = $2',
        [orgId, body.hrms_system]
      )

      if (existingHrms.rowCount === 0) {
        // Create new hrms_integration entry
        await query(
          `INSERT INTO public.hrms_integration
           (organization_id, hrms_system, client_id, client_secret_encrypted,
            access_token, refresh_token_encrypted, token_expiry, base_url,
            metadata_json, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            orgId,
            body.hrms_system,
            body.client_id,
            body.client_secret || null,
            body.access_token || null,
            body.refresh_token || null,
            body.token_expiry || null,
            body.base_url || null,
            JSON.stringify(hrmsMetadata),
            body.status || 'active',
          ]
        )
      } else {
        // Update existing hrms_integration entry
        await query(
          `UPDATE public.hrms_integration
           SET client_id = $1,
               client_secret_encrypted = $2,
               access_token = $3,
               refresh_token_encrypted = $4,
               token_expiry = $5,
               base_url = $6,
               metadata_json = $7,
               status = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE organization_id = $9 AND hrms_system = $10`,
          [
            body.client_id,
            body.client_secret || null,
            body.access_token || null,
            body.refresh_token || null,
            body.token_expiry || null,
            body.base_url || null,
            JSON.stringify(hrmsMetadata),
            body.status || 'active',
            orgId,
            body.hrms_system,
          ]
        )
      }
    }

    setResponseStatus(event, 201)
    return {
      statusCode: 201,
      status: 'success',
      data: { id: result.id },
      message: 'Organization integration created successfully (synced with hrms_integration)'
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
