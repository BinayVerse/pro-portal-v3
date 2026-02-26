import { defineEventHandler, setResponseStatus } from 'h3'
// Ensure the db utility exists at the specified path, or update the path below if needed
import { query } from '../utils/db'
import { CustomError } from '../utils/custom.error'
import jwt from 'jsonwebtoken'
import { formatDateTime } from '../../utils'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: number }).user_id
  } catch (err) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    // Get organization and role for user
    const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or organization not assigned', 404)
    }

    const tokenUserOrg = userRow.rows[0].org_id
    const tokenUserRole = userRow.rows[0].role_id

    // Allow superadmin to request specific org via query param 'org' or 'org_id'
    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || null
    const orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    // Recent users: latest updated_at desc, limit 5
    const recentUsersQ = await query(
      `SELECT u.user_id, u.name, u.email, COALESCE(r.role_name, '-') AS role, u.updated_at AS updated_at,
        CASE WHEN u.is_active = true THEN 'Active' ELSE 'Inactive' END AS status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.org_id = $1 AND u.role_id IN (1, 2)
      ORDER BY u.updated_at DESC
      LIMIT 5`,
      [orgId],
    )

    // Recent artifacts: latest updated_at desc, limit 5
    const artefactsQ = await query(
      `SELECT d.id, d.name, d.file_size, d.status, d.updated_at, d.file_category, d.description, d.is_summarized, d.summary, d.document_link,
        COALESCE(c.name, 'Uncategorized') AS category_name, COALESCE(u.name, 'Unknown User') AS uploaded_by_name
      FROM organization_documents d
      LEFT JOIN document_category c ON d.file_category IS NOT NULL AND d.file_category::text = c.id::text
      LEFT JOIN users u ON d.added_by = u.user_id
      WHERE d.org_id = $1
      ORDER BY d.updated_at DESC
      LIMIT 5`,
      [orgId],
    )

    // Integrations overview (counts and statuses)
    const userCountsQuery = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE added_by IS NULL OR (added_by != 'slack_auto_provision' AND added_by != 'teams_auto_provision')) as whatsapp_users,
        COUNT(*) FILTER (WHERE added_by = 'slack_auto_provision') as slack_users,
        COUNT(*) FILTER (WHERE added_by = 'teams_auto_provision') as teams_users,
        COUNT(*) as total_users
      FROM users
      WHERE org_id = $1 AND role_id IS DISTINCT FROM '0'`,
      [orgId],
    )

    const integrationStatusQuery = await query(
      `SELECT 
        CASE WHEN w.whatsapp_status = true THEN 'connected' ELSE 'disconnected' END as whatsapp_status,
        CASE WHEN s.status = 'active' THEN 'connected' ELSE 'disconnected' END as slack_status,
        CASE WHEN t.status = 'active' THEN 'connected' ELSE 'disconnected' END as teams_status
      FROM organizations o
      LEFT JOIN meta_app_details w ON o.org_id = w.org_id
      LEFT JOIN slack_team_mappings s ON o.org_id = s.org_id
      LEFT JOIN teams_tenant_mappings t ON o.org_id = t.org_id
      WHERE o.org_id = $1
      LIMIT 1`,
      [orgId],
    )

    // Basic stats for dashboard
    const artefactsCountQ = await query(
      `SELECT COUNT(*) AS total_artefacts, COALESCE(SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END),0) AS processed_artefacts, COALESCE(SUM(file_size),0) AS total_size
      FROM organization_documents WHERE org_id = $1`,
      [orgId],
    )

    // Token usage: sum of total_tokens from token_cost_calculation for this org
    const tokenUsageQ = await query(
      `SELECT COALESCE(SUM(total_tokens),0) AS total_tokens
      FROM token_cost_calculation WHERE org_id = $1`,
      [orgId],
    )

    // Get organization plan info
    const planInfoQ = await query(
      `SELECT plan_id, plan_start_date FROM organizations WHERE org_id = $1`,
      [orgId],
    )
    const planInfo = planInfoQ.rows[0] || { plan_id: null, plan_start_date: null }

    // Conversations count: total number of queries/rows in token_cost_calculation for this org
    // Only count from plan_start_date onwards if an active plan exists
    // Exclude automated/document summarization entries
    let conversationsQ
    if (planInfo.plan_id && planInfo.plan_start_date) {
      conversationsQ = await query(
        `SELECT COUNT(DISTINCT id) AS total_conversations
          FROM token_cost_calculation
          WHERE org_id = $1
          AND created_at >= $2
          AND COALESCE(question_text, '') NOT ILIKE 'document summarization:%'`,
        [orgId, planInfo.plan_start_date],
      )
    } else {
      conversationsQ = await query(
        `SELECT 0 AS total_conversations`,
        [],
      )
    }

    // Format users
    const recentUsers = (recentUsersQ.rows || []).map((u: any) => ({
      id: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      updated_at: formatDateTime(u.updated_at || u.created_at, 'UTC', 'MM/DD/YYYY'),
      raw_updated_at: u.updated_at || u.created_at,
    }))

    // Format artefacts
    const formatFileSize = (bytes: number): string => {
      if (!bytes) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'kB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const recentArtefacts = (artefactsQ.rows || []).map((d: any) => ({
      id: d.id,
      title: d.name,
      fileName: d.name,
      fileSize: formatFileSize(d.file_size || 0),
      status: d.status,
      updatedAt: formatDateTime(d.updated_at, 'UTC', 'MM/DD/YYYY'),
      raw_updated_at: d.updated_at,
      category: d.category_name,
      uploadedBy: d.uploaded_by_name,
      summarized: d.is_summarized ? 'Yes' : 'No',
      summary: d.summary,
      publicUrl: d.document_link,
    }))

    const userCounts = userCountsQuery.rows[0] || { whatsapp_users: 0, slack_users: 0, teams_users: 0, total_users: 0 }
    const integrationStatus = integrationStatusQuery.rows[0] || { whatsapp_status: 'disconnected', slack_status: 'disconnected', teams_status: 'disconnected' }
    const artefactsStats = artefactsCountQ.rows[0] || { total_artefacts: 0, processed_artefacts: 0, total_size: 0 }

    const tokenUsage = tokenUsageQ.rows[0] || { total_tokens: 0 }
    const conversations = conversationsQ.rows[0] || { total_conversations: 0 }

    const overview = {
      userCounts: {
        whatsapp: parseInt(userCounts.whatsapp_users) || 0,
        slack: parseInt(userCounts.slack_users) || 0,
        teams: parseInt(userCounts.teams_users) || 0,
        total: parseInt(userCounts.total_users) || 0,
      },
      integrationStatus: {
        whatsapp: integrationStatus.whatsapp_status || 'disconnected',
        slack: integrationStatus.slack_status || 'disconnected',
        teams: integrationStatus.teams_status || 'disconnected',
      },
      artefactsStats: {
        totalArtefacts: parseInt(artefactsStats.total_artefacts) || 0,
        processedArtefacts: parseInt(artefactsStats.processed_artefacts) || 0,
        totalSize: formatFileSize(parseInt(artefactsStats.total_size) || 0),
      },
      // Provide token usage in a shape frontend expects
      tokenUsage: {
        allTime: {
          tokens: parseInt(tokenUsage.total_tokens) || 0,
        },
      },
      // Conversations count
      conversations: {
        total: parseInt(conversations.total_conversations) || 0,
      },
    }

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: {
        recentUsers,
        recentArtefacts,
        overview,
      },
      message: 'Dashboard data fetched successfully',
    }
  } catch (err: any) {
    console.error('Dashboard API Error:', err)
    setResponseStatus(event, 500)
    throw new CustomError(err.message || 'Failed to fetch dashboard data', 500)
  }
})
