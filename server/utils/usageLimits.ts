import { query } from './db'

export interface UsageLimits {
  users: number | null
  documents: number | null
  storageGb: number | null
  conversations: number | null
}

export interface UsageStats {
  totalUsers: number
  totalDocuments: number
  totalStorageBytes: number
  totalConversations: number
}

/**
 * Get organization's usage limits from organization table only
 * Returns 0 for all limits if plan is not subscribed or has expired
 */
export async function getOrgUsageLimits(orgId: string): Promise<UsageLimits> {
  const limitQuery = `
    SELECT
      o.org_users AS users,
      o.org_artefacts AS documents,
      o.org_storage_limit_gb AS storage_gb,
      o.org_limit_requests AS conversations,
      o.plan_id,
      o.plan_start_date,
      p.duration,
      p.metadata
    FROM organizations o
    LEFT JOIN plans p ON o.plan_id = p.id
    WHERE o.org_id = $1
  `

  try {
    const result = await query(limitQuery, [orgId])
    if (result.rows.length === 0) {
      return {
        users: 0,
        documents: 0,
        storageGb: 0,
        conversations: 0,
      }
    }

    const row = result.rows[0]

    // console.log(`[getOrgUsageLimits] orgId: ${orgId}, plan_id: ${row.plan_id}, plan_start_date: ${row.plan_start_date}, duration: ${row.duration}`)

    // Check if plan is unlimited (has metadata.unlimited flag)
    let isUnlimited = false
    if (row.metadata) {
      try {
        const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
        isUnlimited = metadata?.unlimited === true
      } catch (e) {
        // ignore metadata parse errors
      }
    }

    // Check if plan is subscribed (must have plan_id and plan_start_date)
    const isPlanSubscribed = row.plan_id && row.plan_start_date

    if (!isPlanSubscribed) {
      // No plan subscribed
      // console.log(`[getOrgUsageLimits] orgId: ${orgId} - No plan subscribed (plan_id: ${row.plan_id}, plan_start_date: ${row.plan_start_date})`)
      return {
        users: 0,
        documents: 0,
        storageGb: 0,
        conversations: 0,
      }
    }

    // If plan is unlimited, return -1 for all limits (indicates unlimited usage)
    if (isUnlimited) {
      // console.log(`[getOrgUsageLimits] orgId: ${orgId} - Plan is UNLIMITED, returning -1 for all limits`)
      return {
        users: -1,
        documents: -1,
        storageGb: -1,
        conversations: -1,
      }
    }

    // If duration is NULL, plan never expires (always active)
    if (!row.duration) {
      // console.log(`[getOrgUsageLimits] orgId: ${orgId} - Plan has no duration (never expires), returning limits: users=${row.users}, documents=${row.documents}, storageGb=${row.storage_gb}, conversations=${row.conversations}`)
      return {
        users: row.users,
        documents: row.documents,
        storageGb: row.storage_gb,
        conversations: row.conversations,
      }
    }

    // Calculate plan expiry date
    const planStartDate = new Date(row.plan_start_date)
    const durationString = row.duration?.toLowerCase() || ''

    const planExpiryDate = new Date(planStartDate)
    if (durationString.includes('month')) {
      planExpiryDate.setMonth(planExpiryDate.getMonth() + 1)
    } else if (durationString.includes('year')) {
      planExpiryDate.setFullYear(planExpiryDate.getFullYear() + 1)
    }

    // Check if plan has expired
    const now = new Date()
    // console.log(`[getOrgUsageLimits] orgId: ${orgId} - plan_start: ${planStartDate.toISOString()}, plan_expiry: ${planExpiryDate.toISOString()}, now: ${now.toISOString()}`)

    if (now > planExpiryDate) {
      // Plan has expired
      // console.log(`[getOrgUsageLimits] orgId: ${orgId} - Plan has EXPIRED`)
      return {
        users: 0,
        documents: 0,
        storageGb: 0,
        conversations: 0,
      }
    }

    // Plan is active and not expired, return the limits
    // console.log(`[getOrgUsageLimits] orgId: ${orgId} - Plan is ACTIVE, returning limits: users=${row.users}, documents=${row.documents}, storageGb=${row.storage_gb}, conversations=${row.conversations}`)
    return {
      users: row.users,
      documents: row.documents,
      storageGb: row.storage_gb,
      conversations: row.conversations,
    }
  } catch (error) {
    console.error('Error fetching org usage limits:', error)
    return {
      users: 0,
      documents: 0,
      storageGb: 0,
      conversations: 0,
    }
  }
}

/**
 * Get current usage stats for an organization
 */
export async function getOrgUsageStats(orgId: string): Promise<UsageStats> {
  try {
    // Get user count
    const userCountQuery = `
      SELECT COUNT(*) as count FROM users WHERE org_id = $1
    `
    const userResult = await query(userCountQuery, [orgId])
    const totalUsers = parseInt(userResult.rows[0]?.count || 0, 10)

    // Get artifact count and total storage
    const docQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
      FROM organization_documents
      WHERE org_id = $1
    `
    const docResult = await query(docQuery, [orgId])
    const totalDocuments = parseInt(docResult.rows[0]?.count || 0, 10)
    const totalStorageBytes = parseInt(docResult.rows[0]?.total_size || 0, 10)

    // Get conversation count (distinct chat_ids)
    const chatQuery = `
      SELECT COUNT(DISTINCT chat_id) as count FROM chat_history WHERE org_id = $1
    `
    const chatResult = await query(chatQuery, [orgId])
    const totalConversations = parseInt(chatResult.rows[0]?.count || 0, 10)

    return {
      totalUsers,
      totalDocuments,
      totalStorageBytes,
      totalConversations,
    }
  } catch (error) {
    console.error('Error fetching org usage stats:', error)
    return {
      totalUsers: 0,
      totalDocuments: 0,
      totalStorageBytes: 0,
      totalConversations: 0,
    }
  }
}

/**
 * Check if adding users would exceed limit
 */
export async function checkUserLimitExceeded(
  orgId: string,
  numberOfNewUsers: number = 1,
): Promise<{ exceeded: boolean; current: number; limit: number | null; message: string }> {
  const limits = await getOrgUsageLimits(orgId)
  const stats = await getOrgUsageStats(orgId)

  console.log(`[checkUserLimitExceeded] orgId: ${orgId}, limits.users: ${limits.users}, current: ${stats.totalUsers}`)

  // Unlimited plan (-1) - always allow
  if (limits.users === -1) {
    console.log(`[checkUserLimitExceeded] Unlimited plan - allowing user creation`)
    return { exceeded: false, current: stats.totalUsers, limit: null, message: '' }
  }

  if (limits.users === 0) {
    // Plan expired or not subscribed - block all user creation
    console.log(`[checkUserLimitExceeded] Plan expired/unsubscribed - blocking user creation`)
    return {
      exceeded: true,
      current: stats.totalUsers,
      limit: limits.users,
      message: `User limit exceeded. Your plan has expired or is not subscribed. Please renew your subscription.`,
    }
  }

  if (limits.users === null) {
    // No limit set
    return { exceeded: false, current: stats.totalUsers, limit: limits.users, message: '' }
  }

  const wouldBe = stats.totalUsers + numberOfNewUsers
  if (wouldBe > limits.users) {
    console.log(`[checkUserLimitExceeded] Limit exceeded - would be: ${wouldBe}, limit: ${limits.users}`)
    return {
      exceeded: true,
      current: stats.totalUsers,
      limit: limits.users,
      message: `The User limit for your plan has been reached. Please contact your Organization Admin to upgrade and continue.`,
    }
  }

  return { exceeded: false, current: stats.totalUsers, limit: limits.users, message: '' }
}

/**
 * Check if adding documents would exceed limits
 */
export async function checkDocumentLimitExceeded(
  orgId: string,
  fileSizeBytes: number = 0,
): Promise<{
  exceeded: boolean
  documentCountExceeded: boolean
  storageLimitExceeded: boolean
  current: { documents: number; storageGb: number }
  limit: { documents: number | null; storageGb: number | null }
  message: string
}> {
  const limits = await getOrgUsageLimits(orgId)
  const stats = await getOrgUsageStats(orgId)

  const currentStorageGb = stats.totalStorageBytes / (1024 * 1024 * 1024)
  const fileStorageGb = fileSizeBytes / (1024 * 1024 * 1024)

  console.log(`[checkDocumentLimitExceeded] orgId: ${orgId}, limits: ${JSON.stringify(limits)}, currentDocs: ${stats.totalDocuments}, fileSize: ${fileStorageGb.toFixed(2)}GB, currentStorage: ${currentStorageGb.toFixed(2)}GB`)

  let documentCountExceeded = false
  let storageLimitExceeded = false
  let message = ''

  // Unlimited plan (-1) - always allow
  if (limits.documents === -1 && limits.storageGb === -1) {
    console.log(`[checkDocumentLimitExceeded] Unlimited plan - allowing upload`)
    return {
      exceeded: false,
      documentCountExceeded: false,
      storageLimitExceeded: false,
      current: {
        documents: stats.totalDocuments,
        storageGb: parseFloat(currentStorageGb.toFixed(2)),
      },
      limit: {
        documents: null,
        storageGb: null,
      },
      message: '',
    }
  }

  // Check if plan is expired/unsubscribed (limits are 0 and not unlimited)
  if (limits.documents === 0 || limits.storageGb === 0) {
    console.log(`[checkDocumentLimitExceeded] Plan expired/unsubscribed - limits are 0, blocking upload`)
    documentCountExceeded = true
    storageLimitExceeded = true
    message = `Artifact upload not allowed. Your plan has expired or is not subscribed. Please renew your subscription.`
    return {
      exceeded: true,
      documentCountExceeded,
      storageLimitExceeded,
      current: {
        documents: stats.totalDocuments,
        storageGb: parseFloat(currentStorageGb.toFixed(2)),
      },
      limit: {
        documents: limits.documents,
        storageGb: limits.storageGb,
      },
      message,
    }
  }

  // Check artifact count limit (skip if -1 = unlimited)
  if (limits.documents !== null && limits.documents > 0) {
    if (stats.totalDocuments >= limits.documents) {
      documentCountExceeded = true
      message += `The Artifact limit for your plan has been reached. Please contact your Organization Admin to upgrade and continue.`
      console.log(`[checkDocumentLimitExceeded] Artifact count exceeded - current: ${stats.totalDocuments}, limit: ${limits.documents}`)
    }
  }

  // Check storage limit (skip if -1 = unlimited)
  if (limits.storageGb !== null && limits.storageGb > 0) {
    if (currentStorageGb + fileStorageGb > limits.storageGb) {
      storageLimitExceeded = true
      message += `The Artifact Storage limit for your plan has been reached. Please contact your Organization Admin to upgrade and continue. This upload would exceed your storage limit by ${(currentStorageGb + fileStorageGb - limits.storageGb).toFixed(2)}GB.`
      console.log(`[checkDocumentLimitExceeded] Storage limit exceeded - current: ${currentStorageGb.toFixed(2)}GB, file: ${fileStorageGb.toFixed(2)}GB, limit: ${limits.storageGb}GB`)
    }
  }

  return {
    exceeded: documentCountExceeded || storageLimitExceeded,
    documentCountExceeded,
    storageLimitExceeded,
    current: {
      documents: stats.totalDocuments,
      storageGb: parseFloat(currentStorageGb.toFixed(2)),
    },
    limit: {
      documents: limits.documents,
      storageGb: limits.storageGb,
    },
    message: message.trim(),
  }
}

/**
 * Check if adding conversations would exceed limit
 */
export async function checkConversationLimitExceeded(
  orgId: string,
): Promise<{ exceeded: boolean; current: number; limit: number | null; message: string }> {
  const limits = await getOrgUsageLimits(orgId)
  const stats = await getOrgUsageStats(orgId)

  // console.log(`[checkConversationLimitExceeded] orgId: ${orgId}, limits.conversations: ${limits.conversations}, current: ${stats.totalConversations}`)

  // Unlimited plan (-1) - always allow
  if (limits.conversations === -1) {
    // console.log(`[checkConversationLimitExceeded] Unlimited plan - allowing conversation`)
    return { exceeded: false, current: stats.totalConversations, limit: null, message: '' }
  }

  if (limits.conversations === 0) {
    // Plan expired or not subscribed - block all conversations
    // console.log(`[checkConversationLimitExceeded] Plan expired/unsubscribed - blocking conversation`)
    return {
      exceeded: true,
      current: stats.totalConversations,
      limit: limits.conversations,
      message: `Conversation limit exceeded. Your plan has expired or is not subscribed. Please renew your subscription.`,
    }
  }

  if (limits.conversations === null) {
    // No limit set
    return { exceeded: false, current: stats.totalConversations, limit: limits.conversations, message: '' }
  }

  if (stats.totalConversations >= limits.conversations) {
    // console.log(`[checkConversationLimitExceeded] Limit exceeded - current: ${stats.totalConversations}, limit: ${limits.conversations}`)
    return {
      exceeded: true,
      current: stats.totalConversations,
      limit: limits.conversations,
      message: `Conversation limit exceeded. Current: ${stats.totalConversations}, Limit: ${limits.conversations}`,
    }
  }

  return { exceeded: false, current: stats.totalConversations, limit: limits.conversations, message: '' }
}
