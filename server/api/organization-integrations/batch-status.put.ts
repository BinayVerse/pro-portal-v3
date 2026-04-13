import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { createIntegrationAuditLog } from '../../utils/dbHelpers'

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
    if (!Array.isArray(body.integration_ids) || body.integration_ids.length === 0) {
      setResponseStatus(event, 400)
      throw new CustomError('integration_ids array is required and must not be empty', 400)
    }

    if (!body.status) {
      setResponseStatus(event, 400)
      throw new CustomError('status field is required', 400)
    }

    // Validate status value
    const validStatuses = ['active', 'inactive', 'expired', 'failed']
    if (!validStatuses.includes(body.status)) {
      setResponseStatus(event, 400)
      throw new CustomError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }

    const integrationIds = body.integration_ids as string[]
    const newStatus = body.status as 'active' | 'inactive' | 'expired' | 'failed'

    const results: {
      updated: string[]
      errors: Array<{ integration_id: string; error: string }>
    } = {
      updated: [],
      errors: []
    }

    // Update status for each integration
    for (const integrationId of integrationIds) {
      try {
        // Get current integration data for audit log
        const integrationRes = await query(
          `SELECT
            provider_id, module_id, client_id, client_secret, api_key, access_token,
            refresh_token, token_expiry, base_url, login_url, metadata_json, status
           FROM public.organization_integrations
           WHERE id = $1 AND organization_id = $2`,
          [integrationId, orgId]
        )

        if (!integrationRes.rowCount) {
          results.errors.push({
            integration_id: integrationId,
            error: 'Integration not found'
          })
          continue
        }

        const currentData = integrationRes.rows[0]

        // Only update if status is different
        if (currentData.status === newStatus) {
          results.errors.push({
            integration_id: integrationId,
            error: `Status is already ${newStatus}`
          })
          continue
        }

        // Update organization_integrations
        const updateRes = await query(
          `UPDATE public.organization_integrations
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND organization_id = $3
           RETURNING id`,
          [newStatus, integrationId, orgId]
        )

        if (!updateRes.rowCount) {
          throw new Error('Failed to update integration status')
        }

        // Get hrms_system from metadata if this is an HRMS integration
        const metadata = currentData.metadata_json || {}
        const hrmsSystem = metadata.hrms_system

        // Also update hrms_integration status if it exists
        if (hrmsSystem) {
          await query(
            `UPDATE public.hrms_integration
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE organization_id = $2 AND hrms_system = $3`,
            [newStatus, orgId, hrmsSystem]
          )
        }

        // Create audit log
        const newData = { ...currentData, status: newStatus }
        await createIntegrationAuditLog(
          integrationId,
          orgId,
          'status_change',
          userId,
          event,
          currentData,
          newData
        )

        results.updated.push(integrationId)
      } catch (err: any) {
        results.errors.push({
          integration_id: integrationId,
          error: err.message || 'Failed to update integration status'
        })
      }
    }

    // Check if any operations succeeded
    if (results.updated.length === 0) {
      setResponseStatus(event, 500)
      return {
        statusCode: 500,
        status: 'error',
        message: 'Failed to update any integrations',
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
        message: `Integration(s) status updated successfully!`
      }
    }

    // Partial success
    setResponseStatus(event, 207)
    return {
      statusCode: 207,
      status: 'partial_success',
      data: results,
      message: `Updated status for ${results.updated.length} out of ${integrationIds.length} integrations`,
      errors: results.errors
    }
  } catch (error: any) {
    console.error('Organization Integration Batch Status Update Error:', error)

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
      message: 'Failed to update organization integrations status'
    }
  }
})
