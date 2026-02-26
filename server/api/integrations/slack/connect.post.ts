import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { code, state } = body

  if (!code || !state) {
    throw new CustomError('Missing code or state from Slack', 400)
  }

  let orgId: string
  try {
    const decoded = jwt.verify(state, config.jwtToken as string) as { org_id: string }
    orgId = decoded.org_id
  } catch {
    throw new CustomError('Invalid or expired state', 400)
  }

  // Exchange code for access token
  const requestBody = new URLSearchParams({
    client_id: config.public.slackClientId.replace("-", "."),
    client_secret: config.slackClientSecret,
    code,
    redirect_uri: config.public.slackRedirectUri as string,
  })

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: requestBody,
  })

  const data = await response.json()

  if (!data.ok) {
    throw new CustomError(`Slack error: ${data.error}`, 400)
  }

  const {
    access_token,
    team: { id: team_id, name: team_name },
    authed_user: { id: installed_by_user_id },
  } = data

  // Determine current app user from state (if included) or fall back to Slack installed_by_user_id
  let currentAppUserId: any = null
  try {
    const decodedState = jwt.verify(state, config.jwtToken as string) as { org_id: string; user_id?: any }
    currentAppUserId = (decodedState as any).user_id ?? installed_by_user_id
  } catch {
    // fallback: treat installed_by_user_id as installer id
    currentAppUserId = installed_by_user_id
  }

  try {
    await query('BEGIN')

    const conflictCheck = await query(
      `SELECT * FROM slack_team_mappings WHERE team_id = $1 AND org_id != $2 AND status = 'active' LIMIT 1`,
      [team_id, orgId]
    )

    if (conflictCheck.rows.length > 0) {
      throw new CustomError('This Slack workspace is already connected to another organization.', 403)
    }

    await query(
      `DELETE FROM slack_team_mappings WHERE org_id = $1 AND status = 'inactive'`,
      [orgId]
    )

    await query(
      `DELETE FROM slack_team_mappings WHERE team_id = $1 AND status = 'inactive'`,
      [team_id]
    )

    const teamCheck = await query(
      `SELECT * FROM slack_team_mappings WHERE team_id = $1 LIMIT 1`,
      [team_id]
    )

    if (teamCheck.rows.length > 0) {
      await query(
        `UPDATE slack_team_mappings SET org_id = $1, team_name = $2, access_token = $3, installed_by_user_id = $4, updated_at = NOW(), status = 'active', updated_by = $6 WHERE team_id = $5`,
        [orgId, team_name, access_token, installed_by_user_id, team_id, currentAppUserId]
      )
    } else {
      const orgCheck = await query(
        `SELECT * FROM slack_team_mappings WHERE org_id = $1 LIMIT 1`,
        [orgId]
      )

      if (orgCheck.rows.length > 0) {
        await query(
          `UPDATE slack_team_mappings SET team_id = $1, team_name = $2, access_token = $3, installed_by_user_id = $4, updated_at = NOW(), status = 'active', updated_by = $6 WHERE org_id = $5`,
          [team_id, team_name, access_token, installed_by_user_id, orgId, currentAppUserId]
        )
      } else {
        await query(
          `INSERT INTO slack_team_mappings (team_id, org_id, team_name, access_token, installed_by_user_id, updated_at, status, added_by) VALUES ($1, $2, $3, $4, $5, NOW(), 'active', $6)`,
          [team_id, orgId, team_name, access_token, installed_by_user_id, currentAppUserId]
        )
      }
    }

    await query('COMMIT')
  } catch (error) {
    await query('ROLLBACK')
    throw error
  }

  // Notify all 'user' role users about Slack availability
  try {
    const { shouldNotifyChannel, markChannelNotified, sendChannelAvailableMail } = await import('../../helper')
    const notifyAllowed = await shouldNotifyChannel(orgId, 'slack', 24)
    if (notifyAllowed) {
      const users = await query('SELECT name, email FROM users WHERE org_id = $1 AND role_id IN (1,2)', [orgId])
      for (const u of users.rows) {
        try {
          await sendChannelAvailableMail(u.name, u.email, 'slack', undefined, orgId)
        } catch (e) {
          console.error('Failed to send Slack availability email to', u.email, e?.message || e)
        }
      }
      await markChannelNotified(orgId, 'slack')
    }
  } catch (e) {
    console.error('Failed to fetch users for Slack notification', e?.message || e)
  }

  setResponseStatus(event, 201)
  return {
    statusCode: 201,
    message: 'Slack connected successfully',
    data: {
      teamId: team_id,
      teamName: team_name,
      installedBy: installed_by_user_id,
    },
  }
})
