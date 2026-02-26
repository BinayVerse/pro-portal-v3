import { defineEventHandler, readBody, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
  generateRandomPassword,
  generateResetLink,
  sendDepartmentAdminWelcomeMail,
  sendUserAdditionMail,
  sendWelcomeMail,
} from '../helper'
import { isPersonalEmail, personalEmailDomains } from '~/utils'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  const params = await readBody(event)
  const userId = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Determine caller role/org and allow superadmin to update cross-org
  let callerUserId: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    callerUserId = decodedToken.user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const callerRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [callerUserId])
  if (!callerRow?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('Caller not found', 404)
  }
  const callerOrg = callerRow.rows[0].org_id
  const callerRole = callerRow.rows[0].role_id

  if (!userId) {
    setResponseStatus(event, 400)
    throw new CustomError('User ID is required', 400)
  }

  try {
    // Fetch the target user without scoping to caller org so superadmin can edit across orgs
    const fetchUserQuery = `
      SELECT users.*, organizations.org_name, organizations.qr_code
      FROM users
      LEFT JOIN organizations ON users.org_id = organizations.org_id
      WHERE users.user_id = $1;
    `
    const userResult = await query(fetchUserQuery, [userId])

    if (userResult.rows.length === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or unauthorized', 404)
    }

    const currentUser = userResult.rows[0]
    const previousRoleId = Number(currentUser.role_id)
    const incomingRoleId = params.role_id ? Number(params.role_id) : previousRoleId

    let orgId = currentUser.org_id

    // Allow superadmin to target a different org via query param (org or org_id)
    try {
      const q = getQuery(event) as Record<string, any>
      const requestedOrg = q?.org || q?.org_id || null
      if (callerRole === 0 && requestedOrg) {
        const parsed = Number(requestedOrg)
        orgId = Number.isFinite(parsed) ? parsed : String(requestedOrg)
      }
    } catch (e) { }

    // If not superadmin, ensure caller belongs to same org
    if (callerRole !== 0 && String(callerOrg) !== String(orgId)) {
      setResponseStatus(event, 403)
      throw new CustomError('Forbidden: Cannot modify users from another organization', 403)
    }

    // 🔑 DEPARTMENT ADMIN RESTRICTIONS
    if (callerRole === 3) {
      // Department Admin cannot change roles
      if (params.role_id && Number(params.role_id) !== previousRoleId) {
        setResponseStatus(event, 403)
        throw new CustomError('Department Admins cannot change user roles', 403)
      }

      // Department Admin can only assign departments they have access to
      if (params.departments && Array.isArray(params.departments)) {
        // Get Department Admin's departments
        const adminDeptResult = await query(
          `SELECT dept_id FROM user_departments WHERE user_id = $1`,
          [String(callerUserId)],
        )
        const adminDepts = adminDeptResult.rows.map(r => String(r.dept_id))

        // Check if all requested departments are in the admin's departments
        const allAuthorized = params.departments.every((deptId: string) =>
          adminDepts.includes(String(deptId))
        )

        if (!allAuthorized) {
          setResponseStatus(event, 403)
          throw new CustomError('Department Admins can only assign users to their own departments', 403)
        }
      }
    }

    const appLink = `${config.public.appUrl}/login`
    const updates: string[] = []
    const values: any[] = []

    if (params.email && params.email !== currentUser.email) {
      const isCurrentPersonal = isPersonalEmail(currentUser.email, personalEmailDomains)
      const isNewPersonal = isPersonalEmail(params.email, personalEmailDomains)

      if (!isCurrentPersonal && isNewPersonal) {
        setResponseStatus(event, 403)
        throw new CustomError('Cannot change a domain email to a personal email address', 403)
      }

      const emailCheckQuery = `
        SELECT user_id FROM users 
        WHERE email = $1 AND org_id = $2 AND user_id != $3;
      `
      const emailCheckResult = await query(emailCheckQuery, [params.email, orgId, userId])

      if (emailCheckResult.rows.length > 0) {
        setResponseStatus(event, 409)
        throw new CustomError('Email is already in use within this organization', 409)
      }

      updates.push(`email = $${updates.length + 1}::text`)
      values.push(params.email)
    }

    if (params.contact_number && params.contact_number !== currentUser.contact_number) {
      const contactCheckQuery = `
        SELECT user_id FROM users 
        WHERE contact_number = $1 AND org_id = $2 AND user_id != $3;
      `
      const contactCheckResult = await query(contactCheckQuery, [
        params.contact_number,
        orgId,
        userId,
      ])

      if (contactCheckResult.rows.length > 0) {
        setResponseStatus(event, 409)
        throw new CustomError('Contact number is already in use within this organization', 409)
      }

      updates.push(`contact_number = $${values.length + 1}::text`)
      values.push(params.contact_number)
    }

    if (params.name) {
      updates.push(`name = $${values.length + 1}::text`)
      values.push(params.name)
    }
    if (params.role_id) {
      updates.push(`role_id = $${values.length + 1}::int`)
      values.push(params.role_id)
    }
    if (params.primary_contact !== undefined) {
      updates.push(`primary_contact = $${values.length + 1}::boolean`)
      values.push(params.primary_contact)
    }

    if (params.role_id && params.role_id == '1' && currentUser.role_id != '1') {
      const checkAdminQuery = `
        SELECT o.org_name FROM users u
        JOIN organizations o ON u.org_id = o.org_id
        WHERE u.email = $1 AND u.role_id = '1' AND u.org_id != $2;
      `
      const emailToCheck = params.email || currentUser.email
      const adminCheckResult = await query(checkAdminQuery, [emailToCheck, orgId])

      if (adminCheckResult.rows.length > 0) {
        setResponseStatus(event, 409)
        throw new CustomError(
          `Cannot assign the admin role to the user, as the user is already an admin of ${adminCheckResult.rows[0].org_name} organization`,
          409,
        )
      }

      const password = generateRandomPassword()
      const hashedPassword = await bcrypt.hash(password, 10)
      updates.push(`password = $${values.length + 1}::text`)
      values.push(hashedPassword)

      const { resetLink } = await generateResetLink(currentUser.email, config.public.appUrl, userId)
      await sendWelcomeMail(currentUser.name, currentUser.email, password, appLink, resetLink)
    } else if (currentUser.role_id == '1' && params.role_id != '1') {
      updates.push(`password = NULL`)

      try {
        // Determine available channels for the org
        const integ = await query(
          `SELECT o.qr_code, COALESCE(w.whatsapp_status, false) AS whatsapp_status, COALESCE(s.status, 'inactive') AS slack_status, COALESCE(t.status, 'inactive') AS teams_status
           FROM organizations o
           LEFT JOIN meta_app_details w ON o.org_id = w.org_id
           LEFT JOIN slack_team_mappings s ON o.org_id = s.org_id
           LEFT JOIN teams_tenant_mappings t ON o.org_id = t.org_id
           WHERE o.org_id = $1 LIMIT 1`,
          [orgId]
        )
        const row = integ.rows[0] || {}
        const channels: string[] = []
        if (row.whatsapp_status) channels.push('whatsapp')
        if (row.slack_status === 'active' || row.slack_status === 'connected') channels.push('slack')
        if (row.teams_status === 'active' || row.teams_status === 'connected') channels.push('teams')

        // If no channels connected, skip sending the invitation
        if (channels.length === 0) {
          console.info('No channels connected for org; skipping user addition email for', currentUser.email)
        } else {
          // Prepare QR signed URL only if whatsapp is enabled and qr exists
          let signedUrl: string | null = null
          if (channels.includes('whatsapp') && currentUser.qr_code) {
            try {
              const qrUrl = currentUser.qr_code as string
              const qrKey = new URL(qrUrl).pathname.slice(1)

              const s3 = new S3Client({
                region: config.awsRegion,
                credentials: {
                  accessKeyId: config.awsAccessKeyId,
                  secretAccessKey: config.awsSecretAccessKey,
                },
              })

              signedUrl = await getSignedUrl(
                s3,
                new GetObjectCommand({
                  Bucket: config.awsBucketName,
                  Key: qrKey,
                }),
                { expiresIn: 604800 },
              )
            } catch (err) {
              console.warn('Failed to generate signed QR url for user invite:', err)
            }
          }

          await sendUserAdditionMail(currentUser.name, currentUser.email, signedUrl, orgId)
        }
      } catch (err) {
        console.error('Failed to determine integrations or send user addition email on role change:', err)
      }
    }

    if (updates.length === 0) {
      setResponseStatus(event, 400)
      throw new CustomError('No fields to update', 400)
    }

    // set who updated
    // updated_by — store as text to avoid mismatched column types
    updates.push(`updated_by = $${values.length + 1}::text`)
    values.push(callerUserId)

    // updated_at is set by DB
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    // Determine placeholder indexes for WHERE clause
    const whereUserIndex = values.length + 1
    const whereOrgIndex = values.length + 2

    // userId and orgId may be stored as text/varchar; pass as-is and cast to text
    values.push(userId)
    values.push(orgId)

    const updateUserQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${whereUserIndex}::text AND org_id = $${whereOrgIndex}::text
      RETURNING user_id;
    `

    // Sanitize undefined values to null (pg cannot accept undefined)
    const sanitizedValues = values.map(v => (typeof v === 'undefined' ? null : v))

    const result = await query(updateUserQuery, sanitizedValues)

    if (result.rowCount === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or unauthorized', 404)
    }

    /* ============================================================
       🔑 DEPARTMENT SYNC (DIFF-BASED)
    ============================================================ */
    const targetRoleId = Number(params.role_id)
    const incoming = Array.isArray(params.departments)
      ? params.departments.map(String)
      : []

    const existing = await query(
      `SELECT dept_id FROM user_departments WHERE user_id = $1`,
      [String(userId)],
    )

    const existingIds = existing.rows.map(r => String(r.dept_id))

    if (![2, 3].includes(targetRoleId)) {
      // Role no longer supports departments
      await query(`DELETE FROM user_departments WHERE user_id = $1`, [String(userId)])
    } else {
      const toAdd = incoming.filter(d => !existingIds.includes(d))
      const toRemove = existingIds.filter(d => !incoming.includes(d))
      const toUpdate = existingIds.filter(d => incoming.includes(d))

      if (toRemove.length) {
        await query(
          `DELETE FROM user_departments WHERE user_id = $1 AND dept_id = ANY($2)`,
          [String(userId), toRemove],
        )
      }

      for (const deptId of toAdd) {
        await query(
          `
          INSERT INTO user_departments (user_id, dept_id, org_id, created_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, dept_id) DO NOTHING
          `,
          [String(userId), deptId, orgId, callerUserId],
        )
      }

      if (toUpdate.length) {
        await query(
          `
          UPDATE user_departments
          SET updated_by = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
            AND dept_id = ANY($3)
          `,
          [callerUserId, String(userId), toUpdate],
        )
      }
    }

    // 📧 Role transition emails
    try {
      // Promoted to Department Admin
      if (previousRoleId !== 3 && incomingRoleId === 3) {
        const { resetLink } = await generateResetLink(
          currentUser.email,
          config.public.appUrl,
          userId,
        )

        const deptRows = await query(
          `SELECT d.name
            FROM organization_departments d
            JOIN user_departments ud ON ud.dept_id = d.dept_id
            WHERE ud.user_id = $1`,
          [String(userId)],
        )

        const deptNames = deptRows.rows.map(r => r.name)

        const safeDeptNames =
          deptNames.length > 0 ? deptNames : ['(Departments not assigned yet, please contact your org admin)']

        await sendDepartmentAdminWelcomeMail(
          currentUser.name,
          currentUser.email,
          appLink,
          safeDeptNames,
          resetLink,
        )
      }

      // Promoted to Org Admin (already exists in your code earlier)
    } catch (emailErr) {
      console.error('Failed to send role transition email:', emailErr)
    }



    setResponseStatus(event, 200)
    return {
      statusCode: 201,
      status: 'success',
      message: 'User updated successfully',
      userId: result.rows[0].user_id,
    }
  } catch (err: any) {
    console.error('Error updating user:', err)
    if (err instanceof CustomError) {
      setResponseStatus(event, err.statusCode)
      return {
        statusCode: err.statusCode,
        status: 'error',
        message: err.message,
      }
    }
    setResponseStatus(event, 500)
    throw new CustomError(err.message || 'Error updating user', 500)
  }
})
