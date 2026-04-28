import { query } from '~/server/utils/db'
import type { H3Event } from 'h3'
import { getOrgFromToken } from './auth'
import { getHeader } from 'h3'
import { logger } from './logger'

function extractUuid(value: string): string | null {
  if (!value) return null
  const match = value.match(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/
  )
  return match ? match[0].trim() : null
}

/**
 * ✅ Update organization with Chargebee customer ID and tax number
 */
export async function updateOrganizationCustomer(
  event: H3Event,
  customerId: string,
  taxNumber?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { orgId } = getOrgFromToken(event)

    const sql = `
            UPDATE public.organizations
            SET 
            chargebee_customer_id = $1,
            org_tax_id = COALESCE($2, org_tax_id),
            updated_at = CURRENT_TIMESTAMP
            WHERE org_id = $3
            RETURNING org_id, chargebee_customer_id, org_tax_id;
        `
    const res = await query(sql, [customerId, taxNumber || null, orgId])
    if (!res.rowCount) throw new Error(`Organization not found: ${orgId}`)

    return { success: true, data: res.rows[0] }
  } catch (error: any) {
    logger.error({ error: error.message || error }, 'DB Error: updateOrganizationCustomer failed')
    return { success: false, error: error.message || 'Update failed' }
  }
}

/**
 * ✅ Insert billing address
 */
export async function upsertBillingAddress(
  event: H3Event,
  billing: any
): Promise<{ success: boolean; message: string; id?: string; error?: string }> {
  try {
    const { orgId } = getOrgFromToken(event)

    const billingData = {
      org_id: orgId,
      name: `${billing.firstName || ''} ${billing.lastName || ''}`.trim(),
      contact_number: billing.phoneNumber || '',
      email: billing.email || '',
      address_line1: billing.addressLine1 || '',
      address_line2: billing.addressLine2 || '',
      address_city: billing.city || '',
      address_state: billing.region || '',
      address_zip: billing.zipcode || '',
      address_country: billing.country || '',
      address_phone: billing.phoneNumber || '',
    }

    /** -----------------------------------------------------------
     * CHECK IF BILLING ADDRESS ALREADY EXISTS
     * ----------------------------------------------------------- */
    const findExisting = await query(
      `SELECT id FROM billing_address WHERE org_id = $1 LIMIT 1`,
      [orgId]
    )

    /** -----------------------------------------------------------
     * UPDATE CASE
     * ----------------------------------------------------------- */
    if (findExisting.rows.length > 0) {
      const existingId = findExisting.rows[0].id

      const updateSQL = `
                UPDATE billing_address
                SET
                    name = $1,
                    contact_number = $2,
                    email = $3,
                    address_line1 = $4,
                    address_line2 = $5,
                    address_city = $6,
                    address_state = $7,
                    address_zip = $8,
                    address_country = $9,
                    address_phone = $10,
                    updated_at = CURRENT_TIMESTAMP
                WHERE org_id = $11
                RETURNING id
            `

      const params = [
        billingData.name,
        billingData.contact_number,
        billingData.email,
        billingData.address_line1,
        billingData.address_line2,
        billingData.address_city,
        billingData.address_state,
        billingData.address_zip,
        billingData.address_country,
        billingData.address_phone,
        billingData.org_id,
      ]

      const updateRes = await query(updateSQL, params)

      return {
        success: true,
        message: 'Billing address updated successfully',
        id: updateRes.rows[0].id,
      }
    }

    /** -----------------------------------------------------------
     * INSERT CASE
     * ----------------------------------------------------------- */
    const insertSQL = `
            INSERT INTO billing_address (
                org_id, name, contact_number, email,
                address_line1, address_line2, address_city,
                address_state, address_zip, address_country, address_phone
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id
        `

    const insertParams = [
      billingData.org_id,
      billingData.name,
      billingData.contact_number,
      billingData.email,
      billingData.address_line1,
      billingData.address_line2,
      billingData.address_city,
      billingData.address_state,
      billingData.address_zip,
      billingData.address_country,
      billingData.address_phone,
    ]

    const insertRes = await query(insertSQL, insertParams)

    return {
      success: true,
      message: 'Billing address created successfully',
      id: insertRes.rows[0].id,
    }

  } catch (err: any) {
    logger.error({ error: err.message || err }, 'Billing Address upsert failed')
    return {
      success: false,
      message: err.message || 'Billing update failed',
      error: err.message || 'Billing update failed',
    }
  }
}


/**
 * Update organization subscription
 */
export async function updateOrganizationSubscription(
  event: H3Event,
  planId: string,
  subscriptionId: string,
  metadata: any = {},
  purchaseType: 'subscription' | 'addon',
  quantity = 1
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { orgId } = getOrgFromToken(event)

    await query('BEGIN', [])

    // --------------------------------------------------
    // 1. Validate & normalize plan ID
    // --------------------------------------------------
    const parsedPlanId = extractUuid(planId)
    if (!parsedPlanId)
      throw new Error(`Invalid planId format: ${planId}`)

    // --------------------------------------------------
    // 2. Fetch plan limits
    // --------------------------------------------------
    const planLimitRes = await query(
      `
                SELECT 
                users,
                limit_requests,
                storage_limit_gb,
                artefacts
                FROM plans
                WHERE id = $1
                LIMIT 1
            `,
      [parsedPlanId]
    )

    if (!planLimitRes.rows.length)
      throw new Error(`Plan not found for id: ${parsedPlanId}`)

    const limits = planLimitRes.rows[0]

    // --------------------------------------------------
    // 3. Update organization limits
    // --------------------------------------------------
    if (purchaseType === 'subscription') {
      await query(
        `
                    UPDATE subscription_details
                    SET status = 'expired'
                    WHERE org_id = $1
                        AND status = 'active'
                `,
        [orgId]
      )
      // 🔵 BASE SUBSCRIPTION → OVERWRITE LIMITS
      const res = await query(
        `
                    UPDATE public.organizations
                    SET
                        plan_id = $1,
                        plan_start_date = CURRENT_TIMESTAMP,
                        chargebee_subscription_id = $2,

                        -- ✅ RESET limits to BASE PLAN ONLY
                        org_users = $4,
                        org_limit_requests = $5,
                        org_storage_limit_gb = $6,
                        org_artefacts = $7,

                        updated_at = CURRENT_TIMESTAMP
                    WHERE org_id = $3
                    RETURNING org_id;
                `,
        [
          parsedPlanId,
          subscriptionId,
          orgId,
          limits.users ?? null,
          limits.limit_requests ?? null,
          limits.storage_limit_gb ?? null,
          limits.artefacts ?? null
        ]
      )

      if (!res.rowCount)
        throw new Error(`Organization not found for subscription update: ${orgId}`)
    }

    if (purchaseType === 'addon') {
      // 🟣 ADDON → ADD LIMITS (PLUS)
      const res = await query(
        `
                    UPDATE public.organizations
                    SET
                        org_users = org_users + COALESCE($1, 0),
                        org_limit_requests = org_limit_requests + COALESCE($2, 0),
                        org_storage_limit_gb = org_storage_limit_gb + COALESCE($3, 0),
                        org_artefacts = org_artefacts + COALESCE($4, 0),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE org_id = $5
                    RETURNING org_id;
                `,
        [
          (limits.users ?? 0) * quantity,
          (limits.limit_requests ?? 0) * quantity,
          (limits.storage_limit_gb ?? 0) * quantity,
          (limits.artefacts ?? 0) * quantity,
          orgId
        ]
      )

      if (!res.rowCount)
        throw new Error(`Organization not found for addon update: ${orgId}`)
    }

    // --------------------------------------------------
    // 4. Insert subscription_details (audit trail)
    // --------------------------------------------------
    const insertRes = await query(
      `
                INSERT INTO public.subscription_details (
                org_id,
                plan_id,
                status,
                subscription_kind,
                addon_quantity,
                addon_limits,
                metadata
                )
                VALUES ($1, $2, 'active', $3, $4, $5, $6)
                RETURNING id;
            `,
      [
        orgId,
        parsedPlanId,
        purchaseType,
        purchaseType === 'addon' ? quantity : null,
        purchaseType === 'addon' ? JSON.stringify(limits) : null,
        JSON.stringify(metadata || {})
      ]
    )

    if (!insertRes.rowCount)
      throw new Error('Failed to insert subscription_details record')

    await query('COMMIT', [])
    return { success: true, id: insertRes.rows[0].id }

  } catch (error: any) {
    await query('ROLLBACK', [])
    logger.error({ error: error.message || error }, 'DB Error: updateOrganizationSubscription failed')
    return { success: false, error: error.message || 'Update failed' }
  }
}

/**
 * Activate Free plan for an organization
 * - No Chargebee
 * - No Braintree
 * - Explicit & auditable
 */
export async function activateFreePlanForOrg(
  event: H3Event,
  planId: string,
  metadata: any = {},
  billing?: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    region?: string
    zipcode?: string
    country?: string
    taxId?: string
  }
) {
  const { orgId } = getOrgFromToken(event)

  // Validate plan is actually free
  const planRes = await query(
    `
            SELECT id, users, limit_requests, storage_limit_gb, artefacts, metadata
            FROM plans
            WHERE id = $1
            LIMIT 1
        `,
    [planId],
  )

  const plan = planRes.rows[0]
  if (!plan || plan.metadata?.free_plan !== true) {
    return {
      success: false,
      error: 'Invalid free plan',
    }
  }

  // Insert or update billing address if provided

  if (billing) {
    await upsertBillingAddress(event, {
      firstName: billing.firstName,
      lastName: billing.lastName,
      email: billing.email,
      phoneNumber: billing.phoneNumber,
      addressLine1: billing.addressLine1,
      addressLine2: billing.addressLine2,
      city: billing.city,
      region: billing.region,
      zipcode: billing.zipcode,
      country: billing.country,
    })
  }

  if (billing?.taxId) {
    await updateOrganizationCustomer(
      event,
      null,
      billing.taxId
    )
  }

  // Expire existing active subscriptions
  await query(
    `
            UPDATE subscription_details
            SET status = 'expired'
            WHERE org_id = $1 AND status = 'active'
        `,
    [orgId],
  )

  // Insert new subscription_details row
  await query(
    `
            INSERT INTO subscription_details (
            org_id,
            plan_id,
            status,
            subscription_kind,
            metadata
            )
            VALUES ($1, $2, 'active', 'subscription', $3)
        `,
    [
      orgId,
      planId,
      JSON.stringify(metadata),
    ],
  )

  // Apply org limits directly
  await query(
    `
            UPDATE organizations
            SET
            plan_id = $1,
            plan_start_date = CURRENT_TIMESTAMP,
            org_users = $2,
            org_limit_requests = $3,
            org_storage_limit_gb = $4,
            org_artefacts = $5,
            chargebee_subscription_id = NULL,
            updated_at = CURRENT_TIMESTAMP
            WHERE org_id = $6
         `,
    [
      planId,
      plan.users,
      plan.limit_requests,
      plan.storage_limit_gb,
      plan.artefacts,
      orgId,
    ],
  )

  return { success: true }
}

/**
 * Fields that exist in hrms_integration table
 * Map: organization_integrations field name → hrms_integration column name
 */
const HRMS_FIELD_MAPPING: Record<string, string> = {
  'client_id': 'client_id',
  'client_secret': 'client_secret_encrypted',
  'access_token': 'access_token',
  'refresh_token': 'refresh_token_encrypted',
  'token_expiry': 'token_expiry',
  'base_url': 'base_url',
  'status': 'status'
}

/**
 * Fields from organization_integrations that have columns in hrms_integration
 */
const HRMS_COLUMN_FIELDS = new Set(Object.keys(HRMS_FIELD_MAPPING))

/**
 * Fields that should NOT go to metadata when syncing to hrms_integration
 * (These are system fields or already handled elsewhere)
 */
const FIELDS_TO_EXCLUDE_FROM_METADATA = new Set([
  'metadata_json',
  'is_hrms',
  'hrms_system',
  'organization_id'
])

/**
 * Create organization integration and sync with hrms_integration if hrms_system is provided
 */
export async function createOrganizationIntegration(
  orgId: string,
  providerId: string,
  agentId: string,
  moduleId: string,
  integrationData: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await query('BEGIN', [])

    // Insert into organization_integrations
    const orgIntegrationSql = `
      INSERT INTO public.organization_integrations (
        organization_id, provider_id, agent_id, module_id,
        client_id, client_secret, api_key,
        access_token, refresh_token, token_expiry, base_url,
        login_url, metadata_json, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `

    // metadata for organization_integrations
    const orgMetadata: Record<string, any> = {}

    if (integrationData.hrms_system) {
      orgMetadata.hrms_system = integrationData.hrms_system
    }


    const orgIntegrationRes = await query(orgIntegrationSql, [
      orgId,
      providerId,
      agentId,
      moduleId,
      integrationData.client_id,
      integrationData.client_secret,
      integrationData.api_key,
      integrationData.access_token,
      integrationData.refresh_token || null,
      integrationData.token_expiry || null,
      integrationData.base_url || null,
      integrationData.login_url || null,
      JSON.stringify(orgMetadata),
      integrationData.status || 'active'
    ])

    const integrationId = orgIntegrationRes.rows[0].id

    // Get provider info to check if it's HRMS
    const providerRes = await query(
      'SELECT code FROM public.integration_providers WHERE id = $1',
      [providerId]
    )

    const providerCode = providerRes.rows[0]?.code

    // If this is an HRMS provider or hrms_system is provided, insert/update in hrms_integration
    if (providerCode === 'hrms' || integrationData.is_hrms === true || integrationData.hrms_system) {
      // Build hrms_integration data by mapping organization_integrations fields
      const hrmsData: Record<string, string> = {
        organization_id: orgId,
        hrms_system: integrationData.hrms_system
      }

      // Map fields that exist in hrms_integration table
      for (const [orgIntField, hrmsColumn] of Object.entries(HRMS_FIELD_MAPPING)) {
        const value = integrationData[orgIntField]
        hrmsData[hrmsColumn] = value !== undefined ? value : null
      }

      const hrmsFields = Object.keys(hrmsData).filter(k => k !== 'organization_id')

      const hrmsSql = `
        INSERT INTO public.hrms_integration (
          organization_id,
          ${hrmsFields.join(', ')},
          metadata_json
        )
        VALUES (
          $1,
          ${hrmsFields.map((_, i) => `$${i + 2}`).join(', ')},
          $${hrmsFields.length + 2}
        )
        ON CONFLICT (organization_id, hrms_system)
        DO UPDATE SET
          ${hrmsFields.map(f => `${f} = EXCLUDED.${f}`).join(', ')},
          metadata_json = EXCLUDED.metadata_json,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
        `

      const hrmsMetadata = {
        api_key: integrationData.api_key,
        login_url: integrationData.login_url,
        base_url: integrationData.base_url,
        provider_id: providerId,
        agent_id: agentId,
        module_ids: integrationData.module_ids || [],
        hrms_system: integrationData.hrms_system
      }


      const hrmsParams = [
        orgId,
        ...hrmsFields.map(f => hrmsData[f]),
        JSON.stringify(hrmsMetadata)
      ]

      await query(hrmsSql, hrmsParams)
    }

    await query('COMMIT', [])
    return { success: true, id: integrationId }
  } catch (error: any) {
    await query('ROLLBACK', [])
    logger.error({ error: error.message || error }, 'DB Error: createOrganizationIntegration failed')
    return { success: false, error: error.message || 'Create failed' }
  }
}

/**
 * Update organization integration and sync with hrms_integration
 */
export async function updateOrganizationIntegration(
  integrationId: string,
  orgId: string,
  providerId: string,
  integrationData: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    await query('BEGIN', [])

    // Update organization_integrations
    const metadata = {
      hrms_system: integrationData.hrms_system || null
    }

    // Store hrms_system in metadata for reference on delete
    if (integrationData.hrms_system) {
      metadata.hrms_system = integrationData.hrms_system
    }

    const orgIntegrationSql = `
      UPDATE public.organization_integrations
      SET
        client_id = $1,
        client_secret = $2,
        api_key = $3,
        access_token = $4,
        refresh_token = $5,
        token_expiry = $6,
        base_url = $7,
        login_url = $8,
        metadata_json = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND organization_id = $12
      RETURNING id, provider_id
    `

    const orgIntegrationRes = await query(orgIntegrationSql, [
      integrationData.client_id,
      integrationData.client_secret,
      integrationData.api_key,
      integrationData.access_token,
      integrationData.refresh_token || null,
      integrationData.token_expiry || null,
      integrationData.base_url || null,
      integrationData.login_url || null,
      JSON.stringify(metadata),
      integrationData.status || 'active',
      integrationId,
      orgId
    ])

    if (!orgIntegrationRes.rowCount) {
      throw new Error('Integration not found')
    }

    // Get provider info
    const providerRes = await query(
      'SELECT code FROM public.integration_providers WHERE id = $1',
      [providerId]
    )

    const providerCode = providerRes.rows[0]?.code

    // If this is an HRMS provider or hrms_system is provided, also update hrms_integration
    if (providerCode === 'hrms' || integrationData.is_hrms === true || integrationData.hrms_system) {
      const hrmsSystem = integrationData.hrms_system

      const hrmsUpdateSql = `
        UPDATE public.hrms_integration
        SET
          client_id = $1,
          client_secret_encrypted = $2,
          access_token = $3,
          refresh_token_encrypted = $4,
          token_expiry = $5,
          base_url = $6,
          status = $7,
          metadata_json = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE organization_id = $9 AND hrms_system = $10
      `

      // Store all fields not in hrms_integration (or in EXCLUDE list) in metadata
      const hrmsMetadata = {
        api_key: integrationData.api_key,
        login_url: integrationData.login_url,
        base_url: integrationData.base_url,
        provider_id: providerId,
        module_ids: integrationData.module_ids || [],
        hrms_system: integrationData.hrms_system
      }


      await query(hrmsUpdateSql, [
        integrationData.client_id,
        integrationData.client_secret,
        integrationData.access_token,
        integrationData.refresh_token || null,
        integrationData.token_expiry || null,
        integrationData.base_url || null,
        integrationData.status || 'active',
        JSON.stringify(hrmsMetadata),
        orgId,
        hrmsSystem
      ])
    }

    await query('COMMIT', [])
    return { success: true }
  } catch (error: any) {
    await query('ROLLBACK', [])
    logger.error({ error: error.message || error }, 'DB Error: updateOrganizationIntegration failed')
    return { success: false, error: error.message || 'Update failed' }
  }
}

/**
 * Delete organization integration and sync with hrms_integration
 */
export async function deleteOrganizationIntegration(
  integrationId: string,
  orgId: string,
  providerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await query('BEGIN', [])

    // Get hrms_system from metadata if this is an HRMS integration
    const integrationRes = await query(
      `SELECT metadata_json FROM public.organization_integrations WHERE id = $1`,
      [integrationId]
    )

    if (integrationRes.rowCount) {
      const metadata = integrationRes.rows[0]?.metadata_json || {}
      const hrmsSystem = metadata.hrms_system

      // Delete from hrms_integration if hrms_system exists
      if (hrmsSystem) {
        await query(
          'DELETE FROM public.hrms_integration WHERE organization_id = $1 AND hrms_system = $2',
          [orgId, hrmsSystem]
        )
      }
    }

    // Delete from organization_integrations
    const deleteRes = await query(
      'DELETE FROM public.organization_integrations WHERE id = $1 AND organization_id = $2',
      [integrationId, orgId]
    )

    if (!deleteRes.rowCount) {
      throw new Error('Integration not found')
    }

    await query('COMMIT', [])
    return { success: true }
  } catch (error: any) {
    await query('ROLLBACK', [])
    logger.error({ error: error.message || error }, 'DB Error: deleteOrganizationIntegration failed')
    return { success: false, error: error.message || 'Delete failed' }
  }
}

/**
 * Log integration audit trail for create, update, delete, and status change operations
 */
export async function createIntegrationAuditLog(
  integrationId: string,
  orgId: string,
  action: 'create' | 'update' | 'delete' | 'status_change',
  userId: string,
  event: H3Event,
  oldData?: Record<string, any>,
  newData?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's name
    const userRes = await query(
      'SELECT name FROM public.users WHERE user_id = $1',
      [userId]
    )
    const performedByName = userRes.rows[0]?.name || null

    // Extract IP address and user agent
    const ipAddress = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || null
    const userAgent = getHeader(event, 'user-agent') || null

    // Insert audit log
    await query(
      `INSERT INTO public.organization_integration_audit_logs (
        integration_id, organization_id, action, performed_by, performed_by_name,
        old_data, new_data, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        integrationId,
        orgId,
        action,
        userId,
        performedByName,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress,
        userAgent
      ]
    )

    return { success: true }
  } catch (error: any) {
    logger.error({ error: error.message || error }, 'DB Error: createIntegrationAuditLog failed')
    return { success: false, error: error.message || 'Audit log failed' }
  }
}
