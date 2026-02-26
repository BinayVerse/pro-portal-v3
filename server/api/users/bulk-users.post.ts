import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { getClient, query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {
  generateRandomPassword,
  generateResetLink,
  sendUserAdditionMail,
  sendWelcomeMail,
} from '../helper'
import { checkUserLimitExceeded } from '../../utils/usageLimits'

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  let client

  try {
    const authHeader = event.node.req.headers['authorization']
    if (!authHeader) {
      setResponseStatus(event, 401)
      throw new CustomError('Unauthorized: No token provided', 401)
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      setResponseStatus(event, 401)
      throw new CustomError('Unauthorized: Invalid authorization header format', 401)
    }

    const decodedToken = jwt.verify(token, config.jwtToken) as { user_id: number }
    const userId = decodedToken.user_id

    const userResult = await query(
      `SELECT user_id, name, email, org_id, role_id FROM users WHERE user_id = $1`,
      [userId],
    )
    if (userResult.rows.length === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }

    // 🔑 DEPARTMENT ADMIN RESTRICTION: Cannot bulk upload users
    if (userResult.rows[0].role_id === 3) {
      setResponseStatus(event, 403)
      throw new CustomError('Department Admins cannot bulk upload users', 403)
    }

    // Allow superadmin override via query or body.org_id
    const q = getQuery(event) as Record<string, any>
    const body = await readBody(event)
    // body can be either an array of users, or an object { users: [...], org_id: '...' }
    // Allow org override via query param, body.org_id, or Referer URL (fallback)
    const referer = (event.node.req.headers['referer'] || event.node.req.headers['referrer'] || null) as string | null
    let requestedOrg = q?.org || q?.org_id || body?.org_id || null
    if (!requestedOrg && referer) {
      try {
        const refUrl = new URL(String(referer))
        requestedOrg = refUrl.searchParams.get('org') || refUrl.searchParams.get('org_id') || requestedOrg
      } catch (e) {
        // ignore invalid referer
      }
    }

    // Only allow org override if caller is superadmin (role_id === 0)
    const effectiveOrgId = userResult.rows[0].role_id === 0 && requestedOrg ? String(requestedOrg) : userResult.rows[0].org_id

    const orgResult = await query(
      `SELECT org_id, org_name, qr_code FROM organizations WHERE org_id = $1`,
      [effectiveOrgId],
    )
    if (orgResult.rows.length === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('Organization not found', 404)
    }

    const orgDetail = orgResult.rows[0]

    // Support both direct array body and object body { users: [...], org_id }
    let usersArray: any[] = []
    if (Array.isArray(body)) {
      usersArray = body
    } else if (body && Array.isArray((body as any).users)) {
      usersArray = (body as any).users
    } else {
      setResponseStatus(event, 400)
      throw new CustomError('Expected an array of users or { users: [...] }', 400)
    }

    // Check user limit before proceeding with bulk upload
    const userLimitCheck = await checkUserLimitExceeded(orgDetail.org_id, usersArray.length)
    if (userLimitCheck.exceeded) {
      setResponseStatus(event, 403)
      throw new CustomError(userLimitCheck.message, 403)
    }

    client = await getClient()
    await client.query('BEGIN')

    const successfulUsers: any[] = []
    const failedUsers: any[] = []

    for (let rowIndex = 0; rowIndex < usersArray.length; rowIndex++) {
      const row = usersArray[rowIndex]
      const name = row.Name?.trim()
      const email = row.Email?.trim()
      const contactNumber = row['Whatsapp Number']?.trim()
      const role = row.Role?.trim().toLowerCase()
      const roleId = role === 'user' ? 2 : 1
      // Ensure roleId is numeric
      if (!Number.isFinite(Number(roleId))) {
        failedUsers.push({ Row: rowIndex + 1, errors: [{ field: 'Role', message: 'Invalid role id' }] })
        continue
      }
      const rowErrors: any[] = []

      try {
        if (roleId === 1) {
          const adminCheck = await query(
            `SELECT o.org_name FROM users u JOIN organizations o ON u.org_id = o.org_id WHERE u.email = $1 AND u.role_id = 1`,
            [email],
          )
          if (adminCheck.rows.length > 0) {
            rowErrors.push({
              field: 'Email',
              message: `Cannot assign the admin role, already admin of ${adminCheck.rows[0].org_name}`,
            })
            failedUsers.push({ Row: rowIndex + 1, errors: rowErrors })
            continue
          }
        }

        const duplicateCheck = await client.query(
          `SELECT email, contact_number FROM users WHERE (email = $1 OR contact_number = $2) AND org_id = $3`,
          [email, contactNumber, orgDetail.org_id],
        )

        duplicateCheck.rows.forEach((existingUser: any) => {
          if (existingUser.email === email) {
            rowErrors.push({
              field: 'Email',
              message: `${email} is already in use in this organization`,
            })
          }
          if (existingUser.contact_number === contactNumber) {
            rowErrors.push({
              field: 'Whatsapp Number',
              message: `${contactNumber} is already in use in this organization`,
            })
          }
        })

        if (rowErrors.length > 0) {
          failedUsers.push({ Row: rowIndex + 1, errors: rowErrors })
          continue
        }

        const password = generateRandomPassword()
        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await client.query(
          `INSERT INTO users (name, email, contact_number, role_id, password, org_id, added_by)
           VALUES ($1, $2, $3, $4::int, $5, $6, $7::text) RETURNING user_id`,
          [name, email, contactNumber, roleId, hashedPassword, orgDetail.org_id, userId],
        )

        successfulUsers.push({
          userId: result.rows[0].user_id,
          email,
          name,
          contact_number: contactNumber,
          role_id: roleId,
          password,
        })
      } catch (err: any) {
        rowErrors.push({ field: 'Database', message: `Database error: ${err.message}` })
        failedUsers.push({ Row: rowIndex + 1, errors: rowErrors })
      }
    }

    if (failedUsers.length > 0) {
      await client.query('ROLLBACK')
      setResponseStatus(event, 400) // Partial success → treated as a bad request
      return {
        status: false,
        message: 'Error occurred during user creation',
        errors: failedUsers,
      }
    }

    await client.query('COMMIT')

    const appLink = `${config.public.appUrl}/login`

    // Determine available channels for org once
    let channels: string[] = []
    let orgQr: string | null = null
    try {
      const integ = await query(
        `SELECT o.qr_code, COALESCE(w.whatsapp_status, false) AS whatsapp_status, COALESCE(s.status, 'inactive') AS slack_status, COALESCE(t.status, 'inactive') AS teams_status
          FROM organizations o
          LEFT JOIN meta_app_details w ON o.org_id = w.org_id
          LEFT JOIN slack_team_mappings s ON o.org_id = s.org_id
          LEFT JOIN teams_tenant_mappings t ON o.org_id = t.org_id
          WHERE o.org_id = $1 LIMIT 1`,
        [orgDetail.org_id]
      )
      const row = integ.rows[0] || {}
      if (row.whatsapp_status) channels.push('whatsapp')
      if (row.slack_status === 'active' || row.slack_status === 'connected') channels.push('slack')
      if (row.teams_status === 'active' || row.teams_status === 'connected') channels.push('teams')
      orgQr = row.qr_code || null
    } catch (e) {
      console.error('Failed to fetch integrations for bulk user emails', e?.message || e)
    }

    for (const user of successfulUsers) {
      try {
        if (user.role_id === 1) {
          const { resetLink } = await generateResetLink(user.email, config.public.appUrl, user.userId)
          await sendWelcomeMail(user.name, user.email, user.password, appLink, resetLink)
        } else if (user.role_id === 2) {
          // Send email only if channels are available for the org
          if (channels.length > 0) {
            await sendUserAdditionMail(user.name, user.email, orgQr, orgDetail.org_id)
          } else {
            console.info('Skipping invite email for', user.email, '— no channels connected for org')
          }
        }
      } catch (err: any) {
        console.error(`Failed to send email to ${user.email}:`, err.message)
      }
    }

    setResponseStatus(event, 201) // POST success
    return {
      statusCode: 201,
      status: 'success',
      message: `${successfulUsers.length} users successfully added`,
      data: successfulUsers,
      errors: [],
    }
  } catch (error: any) {
    if (client) await client.query('ROLLBACK')
    console.error('Handler Error:', error)

    if (error instanceof CustomError) {
      setResponseStatus(event, error.statusCode)
      return {
        statusCode: error.statusCode,
        status: 'error',
        message: error.message,
      }
    }

    setResponseStatus(event, 500)
    return {
      status: false,
      message: 'An unexpected error occurred',
    }
  } finally {
    if (client) client.release()
  }
})
