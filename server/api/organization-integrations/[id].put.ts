import { defineEventHandler, readBody, setResponseStatus, getRouterParam } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { updateOrganizationIntegration, createIntegrationAuditLog } from '../../utils/dbHelpers'

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
    const currentRes = await query(
      `SELECT
        provider_id, connection_name, client_id, client_secret, api_key, access_token,
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
    const mergedData = {
      connection_name: body.connection_name ?? currentData.connection_name,
      client_id: body.client_id ?? currentData.client_id,
      client_secret: body.client_secret ?? currentData.client_secret,
      api_key: body.api_key ?? currentData.api_key,
      access_token: body.access_token ?? currentData.access_token,
      refresh_token: body.refresh_token ?? currentData.refresh_token,
      token_expiry: body.token_expiry ?? currentData.token_expiry,
      base_url: body.base_url ?? currentData.base_url,
      login_url: body.login_url ?? currentData.login_url,
      metadata_json: body.metadata_json ?? currentData.metadata_json,
      status: body.status ?? currentData.status,
      hrms_system: body.hrms_system,
      is_hrms: body.is_hrms,
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
      message = `${currentData.connection_name}: Status updated to ${statusLabel}`
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

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      message
    }
  } catch (error: any) {
    console.error('Organization Integration Update Error:', error)

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
