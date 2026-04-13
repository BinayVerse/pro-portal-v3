import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { createOrganizationIntegration, updateOrganizationIntegration, createIntegrationAuditLog } from '../../utils/dbHelpers'

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
    const requiredFields = ['provider_id', 'agent_id', 'module_ids', 'existing_module_ids']
    for (const field of requiredFields) {
      if (!(field in body)) {
        setResponseStatus(event, 400)
        throw new CustomError(`Missing required field: ${field}`, 400)
      }
    }

    if (!Array.isArray(body.module_ids) || !Array.isArray(body.existing_module_ids)) {
      setResponseStatus(event, 400)
      throw new CustomError('module_ids and existing_module_ids must be arrays', 400)
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

    // Cast to string arrays for type safety
    const newModuleIdsArray = body.module_ids as string[]
    const existingModuleIdsArray = body.existing_module_ids as string[]

    // Validate all new modules exist
    for (const moduleId of newModuleIdsArray) {
      const moduleRes = await query('SELECT id FROM public.integration_modules WHERE id = $1', [moduleId])
      if (!moduleRes.rowCount) {
        setResponseStatus(event, 400)
        throw new CustomError(`Module not found: ${moduleId}`, 400)
      }
    }

    // Common integration data
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
      module_ids: newModuleIdsArray
    }

    // Determine which modules to add, update, and remove
    const newModuleIds = new Set<string>(newModuleIdsArray)
    const existingModuleIds = new Set<string>(existingModuleIdsArray)

    const modulesToAdd: string[] = [...newModuleIds].filter(id => !existingModuleIds.has(id))
    const modulesToRemove: string[] = [...existingModuleIds].filter(id => !newModuleIds.has(id))
    const modulesToKeep: string[] = [...existingModuleIds].filter(id => newModuleIds.has(id))

    const results: {
      created: string[]
      updated: string[]
      deleted: string[]
      errors: Array<{ module_id: string; action: string; error: string }>
    } = {
      created: [],
      updated: [],
      deleted: [],
      errors: []
    }

    // 1. Delete removed modules
    for (const moduleId of modulesToRemove) {
      try {
        // Find the integration to delete - fetch all data for audit log
        const integrationRes = await query(
          `SELECT
            id, provider_id, module_id, client_id, client_secret, api_key, access_token,
            refresh_token, token_expiry, base_url, login_url, metadata_json, status
           FROM public.organization_integrations
           WHERE provider_id = $1 AND agent_id = $2 AND module_id = $3 AND organization_id = $4`,
          [body.provider_id, body.agent_id, moduleId, orgId]
        )

        if (integrationRes.rowCount > 0) {
          const integrationId = integrationRes.rows[0].id as string
          const deletedData = integrationRes.rows[0]

          // Delete the integration
          await query(
            'DELETE FROM public.organization_integrations WHERE id = $1',
            [integrationId]
          )

          results.deleted.push(integrationId)

          // Create audit log with actual deleted data
          await createIntegrationAuditLog(
            integrationId,
            orgId,
            'delete',
            userId,
            event,
            deletedData,
            undefined
          )
        }
      } catch (err: any) {
        results.errors.push({
          module_id: moduleId as string,
          action: 'delete',
          error: err.message || 'Failed to delete integration'
        })
      }
    }

    // 2. Update existing modules with new credentials
    for (const moduleId of modulesToKeep) {
      try {
        const integrationRes = await query(
          `SELECT
            id, provider_id, module_id, client_id, client_secret, api_key, access_token,
            refresh_token, token_expiry, base_url, login_url, metadata_json, status
           FROM public.organization_integrations
           WHERE provider_id = $1 AND agent_id = $2 AND module_id = $3 AND organization_id = $4`,
          [body.provider_id, body.agent_id, moduleId, orgId]
        )

        if (integrationRes.rowCount > 0) {
          const integrationId = integrationRes.rows[0].id as string
          const oldData = integrationRes.rows[0]

          const result = await updateOrganizationIntegration(
            integrationId,
            orgId,
            body.provider_id,
            integrationData
          )

          if (result.success) {
            results.updated.push(integrationId)

            // Create audit log with old and new data
            await createIntegrationAuditLog(
              integrationId,
              orgId,
              'update',
              userId,
              event,
              oldData,
              integrationData
            )
          } else {
            results.errors.push({
              module_id: moduleId as string,
              action: 'update',
              error: result.error || 'Failed to update integration'
            })
          }
        }
      } catch (err: any) {
        results.errors.push({
          module_id: moduleId as string,
          action: 'update',
          error: err.message || 'Failed to update integration'
        })
      }
    }

    // 3. Create new modules
    for (const moduleId of modulesToAdd) {
      try {
        // Check if this agent+module combination already exists for this provider
        const duplicateRes = await query(
          `SELECT id FROM public.organization_integrations
           WHERE organization_id = $1 AND provider_id = $2 AND agent_id = $3 AND module_id = $4`,
          [orgId, body.provider_id, body.agent_id, moduleId]
        )

        if (duplicateRes.rowCount > 0) {
          results.errors.push({
            module_id: moduleId as string,
            action: 'create',
            error: 'This agent and module combination already exists for this provider'
          })
          continue
        }

        const result = await createOrganizationIntegration(
          orgId,
          body.provider_id,
          body.agent_id,
          moduleId,
          integrationData
        )

        if (result.success && result.id) {
          const createdId = result.id as string
          results.created.push(createdId)

          // Fetch created data for audit log
          const createdDataRes = await query(
            `SELECT
              id, provider_id, module_id, client_id, client_secret, api_key, access_token,
              refresh_token, token_expiry, base_url, login_url, metadata_json, status
             FROM public.organization_integrations WHERE id = $1`,
            [createdId]
          )

          const createdData = createdDataRes.rows[0] || integrationData

          // Create audit log
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
          results.errors.push({
            module_id: moduleId as string,
            action: 'create',
            error: result.error || 'Failed to create integration'
          })
        }
      } catch (err: any) {
        results.errors.push({
          module_id: moduleId as string,
          action: 'create',
          error: err.message || 'Failed to create integration'
        })
      }
    }

    // Check if any operations succeeded
    const successCount = results.created.length + results.updated.length + results.deleted.length

    if (successCount === 0) {
      setResponseStatus(event, 500)
      return {
        statusCode: 500,
        status: 'error',
        message: 'Failed to sync integrations',
        errors: results.errors
      }
    }

    // If all succeeded
    if (results.errors.length === 0) {
      setResponseStatus(event, 200)
      return {
        statusCode: 200,
        status: 'success',
        data: results,
        message: `Integrations Updated Successfully!`
      }
    }

    // Partial success
    setResponseStatus(event, 207)
    return {
      statusCode: 207,
      status: 'partial_success',
      data: results,
      message: `Synced ${successCount} out of ${body.module_ids.length + body.existing_module_ids.length} integrations`,
      errors: results.errors
    }
  } catch (error: any) {
    console.error('Organization Integration Batch Sync Error:', error)

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
      message: 'Failed to sync organization integrations'
    }
  }
})
