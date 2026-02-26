import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
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
    userId = (decodedToken as { user_id: string }).user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    // Get user's organization and role
    const userOrg = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userOrg?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or organization not assigned', 404)
    }
    const tokenUserOrg = userOrg.rows[0].org_id
    const tokenUserRole = userOrg.rows[0].role_id

    // Allow superadmin to request specific org via query param 'org'/'org_id'
    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || null
    const orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    // Time window: last 24 hours (UTC)
    const windowStart = dayjs().utc().subtract(24, 'hour').toISOString()

    // Slack integration events
    const slackRows = (await query(
      `SELECT status, updated_at FROM slack_team_mappings WHERE org_id = $1 AND updated_at >= $2 ORDER BY updated_at DESC LIMIT 5`,
      [orgId, windowStart]
    )).rows || []

    // Teams integration events
    const teamsRows = (await query(
      `SELECT status, updated_at FROM teams_tenant_mappings WHERE org_id = $1 AND updated_at >= $2 ORDER BY updated_at DESC LIMIT 5`,
      [orgId, windowStart]
    )).rows || []

    // WhatsApp events
    const waRows = (await query(
      `SELECT whatsapp_status, updated_at FROM meta_app_details WHERE org_id = $1 AND updated_at >= $2 ORDER BY updated_at DESC LIMIT 5`,
      [orgId, windowStart]
    )).rows || []

    // User events (recent user additions regardless of source)
    const userSyncRows = (await query(
      `SELECT name, email, added_by, created_at FROM users WHERE org_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 10`,
      [orgId, windowStart]
    )).rows || []

    // Token usage events
    const tokenUsageRow = (await query(
      `SELECT COUNT(*)::int AS messages, MAX(created_at) AS last_time FROM token_cost_calculation WHERE org_id = $1 AND created_at >= $2 AND (question_text IS NULL OR question_text NOT ILIKE 'Document summarization:%')`,
      [orgId, windowStart]
    )).rows?.[0] || { messages: 0, last_time: null }

    const activities: any[] = []
    // Map slack
    for (const r of slackRows) {
      const ts = r.updated_at ? new Date(r.updated_at) : new Date()
      const status = r.status || ''
      activities.push({
        id: `slack-${ts.getTime()}`,
        type: status === 'active' ? 'success' : 'warning',
        message: `Slack integration ${status === 'active' ? 'connected' : 'disconnected'}`,
        time: ts.toISOString(),
        timestamp: ts,
      })
    }

    // Map teams
    for (const r of teamsRows) {
      const ts = r.updated_at ? new Date(r.updated_at) : new Date()
      const status = r.status || ''
      activities.push({
        id: `teams-${ts.getTime()}`,
        type: status === 'active' ? 'success' : 'warning',
        message: `Teams integration ${status === 'active' ? 'connected' : 'disconnected'}`,
        time: ts.toISOString(),
        timestamp: ts,
      })
    }

    // Map whatsapp
    for (const r of waRows) {
      const ts = r.updated_at ? new Date(r.updated_at) : new Date()
      const status = !!r.whatsapp_status
      activities.push({
        id: `whatsapp-${ts.getTime()}`,
        type: status ? 'success' : 'warning',
        message: `WhatsApp integration ${status ? 'connected' : 'disconnected'}`,
        time: ts.toISOString(),
        timestamp: ts,
      })
    }

    // Token usage aggregated
    if (tokenUsageRow && parseInt(tokenUsageRow.messages) > 0) {
      const ts = tokenUsageRow.last_time ? new Date(tokenUsageRow.last_time) : new Date()
      activities.push({
        id: `token-usage-${ts.getTime()}`,
        type: 'info',
        message: `${tokenUsageRow.messages} messages processed`,
        time: ts.toISOString(),
        timestamp: ts,
      })
    }

    // Build summary of recent user additions by provider (using userSyncRows)
    const groups: Record<string, { count: number; latestName: string | null; latestTime: string | null }> = {}
    for (const r of userSyncRows) {
      const provider = r.added_by === 'slack_auto_provision' ? 'Slack' : r.added_by === 'teams_auto_provision' ? 'Teams' : 'Manual'
      const key = provider.toLowerCase()
      if (!groups[key]) groups[key] = { count: 0, latestName: null, latestTime: null }
      groups[key].count += 1

      const nameOrEmail = r.name || r.email || 'Unknown user'
      const created = r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()

      // Update latestName/time if this record is newer
      if (!groups[key].latestTime) {
        groups[key].latestTime = created
        groups[key].latestName = nameOrEmail
      } else {
        try {
          const existing = new Date(groups[key].latestTime!).getTime()
          const current = new Date(created).getTime()
          if (!isNaN(current) && current > existing) {
            groups[key].latestTime = created
            groups[key].latestName = nameOrEmail
          }
        } catch (e) {
          // ignore
        }
      }
    }

    const order = ['manual', 'slack', 'teams']
    const summaryActivities: any[] = []
    for (const k of order) {
      if (groups[k]) {
        const providerLabel = k.charAt(0).toUpperCase() + k.slice(1)
        const count = groups[k].count
        const latestName = groups[k].latestName || 'User'
        const latestTime = groups[k].latestTime || new Date().toISOString()
        const action = k === 'manual' ? 'added manually' : `provisioned via ${providerLabel}`
        const others = Math.max(0, count - 1)
        const message = `${latestName}${others > 0 ? ` and ${others} other user${others > 1 ? 's' : ''}` : ''} ${action}`
        summaryActivities.push({
          id: `user-addition-summary-${k}`,
          type: 'info',
          message,
          time: latestTime,
          timestamp: new Date(latestTime),
        })
      }
    }

    // Include any other providers
    for (const k of Object.keys(groups)) {
      if (order.includes(k)) continue
      const providerLabel = k.charAt(0).toUpperCase() + k.slice(1)
      const count = groups[k].count
      const latestName = groups[k].latestName || 'User'
      const latestTime = groups[k].latestTime || new Date().toISOString()
      const message = `${latestName}${count > 1 ? ` and ${count - 1} other user${count - 1 > 1 ? 's' : ''}` : ''} added via ${providerLabel}`
      summaryActivities.push({
        id: `user-addition-summary-${k}`,
        type: 'info',
        message,
        time: latestTime,
        timestamp: new Date(latestTime),
      })
    }

    // Merge activities with summaries, sort and limit to max 5
    const merged = [...activities, ...summaryActivities]
    merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const finalList = merged.slice(0, 5)

    // Get total request count for usage tracking
    const requestCountQuery = await query(
      `SELECT COUNT(*) as total_requests FROM token_cost_calculation WHERE org_id = $1 AND (question_text IS NULL OR question_text NOT ILIKE 'Document summarization:%')`,
      [orgId]
    )
    const totalRequests = parseInt(requestCountQuery.rows[0]?.total_requests || 0)

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: {
        activities: finalList,
        request_count: totalRequests,
      },
      message: 'Recent activity fetched successfully'
    }

  } catch (error: any) {
    console.error('Integrations Activity Error:', error)

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
      message: 'Failed to fetch recent activity'
    }
  }
})
