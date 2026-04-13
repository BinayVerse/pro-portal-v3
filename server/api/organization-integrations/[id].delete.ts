import { defineEventHandler, setResponseStatus, getRouterParam } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { deleteOrganizationIntegration, createIntegrationAuditLog } from '../../utils/dbHelpers'

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

    // Get current integration to verify ownership and get provider_id and other data
    const currentRes = await query(
      `SELECT
        provider_id, module_id, client_id, client_secret, api_key, access_token,
        refresh_token, token_expiry, base_url, login_url, metadata_json, status
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

    // Create audit log for deletion BEFORE deleting (to avoid FK constraint)
    await createIntegrationAuditLog(
      integrationId,
      orgId,
      'delete',
      userId,
      event,
      currentData,
      undefined
    )

    // Delete integration using helper function
    const result = await deleteOrganizationIntegration(
      integrationId,
      orgId,
      providerId
    )

    if (!result.success) {
      setResponseStatus(event, 500)
      throw new CustomError(result.error || 'Failed to delete integration', 500)
    }

    // SYNC: Also delete from hrms_integration table if it references this integration
    const hrmsCheck = await query(
      `SELECT id FROM public.hrms_integration
       WHERE organization_id = $1
       AND metadata_json->>'organization_integration_id' = $2`,
      [orgId, integrationId]
    )

    if (hrmsCheck.rowCount > 0) {
      await query(
        `DELETE FROM public.hrms_integration
         WHERE organization_id = $1
         AND metadata_json->>'organization_integration_id' = $2`,
        [orgId, integrationId]
      )
    }

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      message: 'Organization integration deleted successfully!'
    }
  } catch (error: any) {
    console.error('Organization Integration Delete Error:', error)

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
      message: 'Failed to delete organization integration'
    }
  }
})
