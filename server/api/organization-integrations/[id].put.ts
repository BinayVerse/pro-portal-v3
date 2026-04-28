import { defineEventHandler, readBody, setResponseStatus, getRouterParam } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { updateOrganizationIntegration, createIntegrationAuditLog } from '../../utils/dbHelpers'
import { logError } from '../../utils/logger'

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

    // Read request body
    const body = await readBody(event)

    // Get current integration to verify ownership and get all current values
    // This fetch is needed before checking for duplicates
    const currentRes = await query(
      `SELECT
        provider_id, module_id, client_id, client_secret, api_key, access_token,
        refresh_token, token_expiry, base_url, login_url, metadata_json,
        status
       FROM public.organization_integrations
       WHERE id = $1 AND organization_id = $2`,
      [integrationId, orgId]
    )

    if (!currentRes.rowCount) {
      setResponseStatus(event, 404)
      throw new CustomError('Integration not found', 404)
    }

    const currentData = currentRes.rows[0]
    const providerId = currentData.provider_id

    // Merge current values with provided updates
    // This prevents null constraint violations when partially updating (e.g., status only)
    const mergedLoginUrl = body.login_url ?? currentData.login_url
    const mergedBaseUrl = body.base_url ?? currentData.base_url
    const mergedApiKey = body.api_key ?? currentData.api_key

    const mergedData = {
      client_id: body.client_id ?? currentData.client_id,
      client_secret: body.client_secret ?? currentData.client_secret,
      api_key: mergedApiKey,
      access_token: body.access_token ?? currentData.access_token,
      refresh_token: body.refresh_token ?? currentData.refresh_token,
      token_expiry: body.token_expiry ?? currentData.token_expiry,
      base_url: mergedBaseUrl,
      login_url: mergedLoginUrl,
      metadata_json: {
        login_url: mergedLoginUrl || null,
        base_url: mergedBaseUrl || null,
        api_key: mergedApiKey || null,
        ...(body.metadata_json ?? currentData.metadata_json ?? {})
      },
      status: body.status ?? currentData.status,
      hrms_system: body.hrms_system,
      is_hrms: body.is_hrms,
      module_ids: [currentData.module_id]
    }

    // Update integration using helper function
    const result = await updateOrganizationIntegration(
      integrationId,
      orgId,
      providerId,
      mergedData
    )

    if (!result.success) {
      setResponseStatus(event, 500)
      throw new CustomError(result.error || 'Failed to update integration', 500)
    }

    // Determine action type and build message
    let message = 'Organization integration updated successfully'
    let action: 'update' | 'status_change' = 'update'

    if (body.status && Object.keys(body).length === 1) {
      const statusLabel = body.status.charAt(0).toUpperCase() + body.status.slice(1)
      message = `Integration Status updated to ${statusLabel}`
      action = 'status_change'
    }

    // Create audit log
    await createIntegrationAuditLog(
      integrationId,
      orgId,
      action,
      userId,
      event,
      currentData,
      mergedData
    )

    // Note: HRMS integration is already handled by updateOrganizationIntegration helper function

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      message: message
    }
  } catch (error: any) {
    logError('Organization Integration Update Error', error)

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
      message: 'Failed to update organization integration'
    }
  }
})
