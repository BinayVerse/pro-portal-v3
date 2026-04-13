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

    // Validate integration_ids array
    if (!Array.isArray(body.integration_ids) || body.integration_ids.length === 0) {
      setResponseStatus(event, 400)
      throw new CustomError('integration_ids array is required and must not be empty', 400)
    }

    const integrationIds = body.integration_ids as string[]

    const results: {
      deleted: string[]
      errors: Array<{ integration_id: string; error: string }>
    } = {
      deleted: [],
      errors: []
    }

    // Delete each integration
    for (const integrationId of integrationIds) {
      try {
        // Get integration data for audit log
        const integrationRes = await query(
          `SELECT
            provider_id, client_id, client_secret, api_key, access_token,
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

        // Create audit log before deletion
        await createIntegrationAuditLog(
          integrationId,
          orgId,
          'delete',
          userId,
          event,
          currentData,
          undefined
        )

        // Get hrms_system from metadata if needed
        const metadata = currentData.metadata_json || {}
        const hrmsSystem = metadata.hrms_system

        // Start transaction for this integration
        await query('BEGIN', [])

        try {
          // Delete from hrms_integration if hrms_system exists
          if (hrmsSystem) {
            await query(
              'DELETE FROM public.hrms_integration WHERE organization_id = $1 AND hrms_system = $2',
              [orgId, hrmsSystem]
            )
          }

          // Delete from organization_integrations
          const deleteRes = await query(
            'DELETE FROM public.organization_integrations WHERE id = $1 AND organization_id = $2',
            [integrationId, orgId]
          )

          if (!deleteRes.rowCount) {
            throw new Error('Failed to delete integration')
          }

          await query('COMMIT', [])
          results.deleted.push(integrationId)
        } catch (err: any) {
          await query('ROLLBACK', [])
          throw err
        }
      } catch (err: any) {
        results.errors.push({
          integration_id: integrationId,
          error: err.message || 'Failed to delete integration'
        })
      }
    }

    // Check if any operations succeeded
    if (results.deleted.length === 0) {
      setResponseStatus(event, 500)
      return {
        statusCode: 500,
        status: 'error',
        message: 'Failed to delete any integrations',
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
        message: `Successfully deleted integration(s)!`
      }
    }

    // Partial success
    setResponseStatus(event, 207)
    return {
      statusCode: 207,
      status: 'partial_success',
      data: results,
      message: `Deleted ${results.deleted.length} out of ${integrationIds.length} integrations`,
      errors: results.errors
    }
  } catch (error: any) {
    console.error('Organization Integration Batch Delete Error:', error)

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
      message: 'Failed to delete organization integrations'
    }
  }
})
