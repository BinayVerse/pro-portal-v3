import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { createUserValidation } from '../../utils/validations'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'
import {
  generateRandomPassword,
  generateResetLink,
  sendDepartmentAdminWelcomeMail,
  sendUserAdditionMail,
  sendWelcomeMail,
} from '../helper'
import { checkUserLimitExceeded } from '../../utils/usageLimits'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const params = await readBody(event)

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId: number
  let currentUser
  let orgDetail

  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    userId = decodedToken.user_id

    const userResult = await query(
      `SELECT user_id, name, email, org_id, role_id FROM users WHERE user_id = $1`,
      [userId],
    )
    if (!userResult.rows.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }

    currentUser = userResult.rows[0]

    // 🔑 DEPARTMENT ADMIN RESTRICTION: Can create users only with USER role (2) and in their departments
    if (currentUser.role_id === 3) {
      if (params.role_id && Number(params.role_id) !== 2) {
        setResponseStatus(event, 403)
        throw new CustomError('Department Admins can only create users with USER role', 403)
      }

      // Get Department Admin's departments
      const adminDeptResult = await query(
        `SELECT dept_id FROM user_departments WHERE user_id = $1`,
        [String(currentUser.user_id)],
      )
      const adminDepts = adminDeptResult.rows.map(r => String(r.dept_id))

      // If departments provided, verify they're all in admin's departments
      if (params.departments && Array.isArray(params.departments)) {
        const allAuthorized = params.departments.every((deptId: string) =>
          adminDepts.includes(String(deptId))
        )

        if (!allAuthorized) {
          setResponseStatus(event, 403)
          throw new CustomError('Department Admins can only assign users to their own departments', 403)
        }
      } else {
        setResponseStatus(event, 400)
        throw new CustomError('Department Admins must assign users to at least one of their departments', 400)
      }
    }

    // Allow superadmin to create user for a requested org via query param or body.org_id
    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || params?.org_id || null
    const effectiveOrgId = currentUser.role_id === 0 && requestedOrg ? String(requestedOrg) : currentUser.org_id

    const orgResult = await query(
      `SELECT org_id, org_name, qr_code FROM organizations WHERE org_id = $1`,
      [effectiveOrgId],
    )
    if (!orgResult.rows.length) {
      setResponseStatus(event, 404)
      throw new CustomError('Organization not found', 404)
    }

    orgDetail = orgResult.rows[0]
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      setResponseStatus(event, 401)
      throw new CustomError('Unauthorized: Invalid token', 401)
    }
    setResponseStatus(event, 500)
    throw new CustomError('Error fetching user or organization details', 500)
  }

  // Validate input
  let userDetails
  try {
    userDetails = await createUserValidation.parseAsync(params)
  } catch (validationError: any) {
    setResponseStatus(event, 400)
    throw new CustomError(validationError.message || 'Invalid input', 400)
  }

  const { name, email, contact_number, role_id } = userDetails
  const appLink = `${config.public.appUrl}/login`
  const password = generateRandomPassword()
  // Normalize role id to number for consistent checks and DB insertion
  const roleIdNum = Number(role_id)
  if (!Number.isFinite(roleIdNum)) {
    setResponseStatus(event, 400)
    throw new CustomError('Invalid role_id: expected a numeric role identifier', 400)
  }
  const normalizedEmail = String(email || '').trim().toLowerCase()

  // Check for duplicates in the same org
  const duplicateCheck = await query(
    `SELECT user_id FROM users WHERE (LOWER(email) = $1 OR contact_number = $2) AND org_id = $3`,
    [normalizedEmail, contact_number, orgDetail.org_id],
  )

  if (duplicateCheck.rows.length > 0) {
    setResponseStatus(event, 409)
    throw new CustomError('Email or Mobile Number already exists in this organization', 409)
  }

  // Admin restriction check: user can be admin in only one organization
  if (roleIdNum === 1) {
    const adminCheck = await query(
      `SELECT o.org_name FROM users u
       JOIN organizations o ON u.org_id = o.org_id
       WHERE LOWER(u.email) = $1 AND u.role_id = 1 AND u.org_id != $2`,
      [normalizedEmail, orgDetail.org_id],
    )

    if (adminCheck.rows.length > 0) {
      setResponseStatus(event, 409)
      throw new CustomError(
        `Cannot assign the admin role to this user, as the user is already an admin of ${adminCheck.rows[0].org_name} organization`,
        409,
      )
    }
  }

  // Check user limit for organization
  const userLimitCheck = await checkUserLimitExceeded(orgDetail.org_id, 1)
  if (userLimitCheck.exceeded) {
    setResponseStatus(event, 403)
    throw new CustomError(userLimitCheck.message, 403)
  }

  // Prepare insert query
  let insertUserQuery = `
    INSERT INTO users (name, email, contact_number, role_id, org_id, added_by)
    VALUES ($1, $2, $3, $4::int, $5, $6::text)
    RETURNING user_id;
  `
  // Ensure role_id is stored as a number
  let values = [name, normalizedEmail, contact_number, roleIdNum, orgDetail.org_id, userId]

  if (roleIdNum === 1) {
    // For admin creation, do NOT store a password; user should set via reset link
    insertUserQuery = `
      INSERT INTO users (name, email, password, contact_number, role_id, org_id, added_by)
      VALUES ($1, $2, $3, $4, $5::int, $6, $7::text)
      RETURNING user_id;
    `
    values = [name, normalizedEmail, null, contact_number, roleIdNum, orgDetail.org_id, userId]
  }

  try {
    const result = await query(insertUserQuery, values)
    const newUserId = result.rows[0].user_id

    // Handle department assignment for USER (role_id = 2) and DEPARTMENT ADMIN (role_id = 3)
    // 🔑 Company Admin can assign one or multiple departments to both roles
    if ((roleIdNum === 2 || roleIdNum === 3) && userDetails.departments && Array.isArray(userDetails.departments) && userDetails.departments.length > 0) {
      try {
        for (const deptId of userDetails.departments) {
          await query(
            `INSERT INTO user_departments (user_id, dept_id, org_id, created_by)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, dept_id) DO NOTHING`,
            [String(newUserId), deptId, orgDetail.org_id, String(userId)],
          )
        }
        console.log(`[create.post.ts] Assigned ${userDetails.departments.length} departments to user ${newUserId}`)
      } catch (e) {
        console.error('Failed to assign departments to user:', e)
      }
    }

    // Email notifications: send welcome email for Admin; for User send invite if channels available
    if (roleIdNum === 1) {
      const { resetLink } = await generateResetLink(normalizedEmail, config.public.appUrl, newUserId)
      await sendWelcomeMail(name, normalizedEmail, password, appLink, resetLink)
    } else if (roleIdNum === 3) {
      // ✅ Department Admin
      const { resetLink } = await generateResetLink(normalizedEmail, config.public.appUrl, newUserId)

      // OPTIONAL: fetch department names for nicer email
      const deptRows = await query(
        `SELECT name FROM organization_departments WHERE dept_id = ANY($1)`,
        [userDetails.departments || []],
      )
      const deptNames = deptRows.rows.map(r => r.name)

      await sendDepartmentAdminWelcomeMail(
        name,
        normalizedEmail,
        appLink,
        deptNames,
        resetLink,
      )

    } else if (roleIdNum === 2) {
      try {
        const integ = await query(
          `SELECT o.qr_code, COALESCE(w.whatsapp_status, false) AS whatsapp_status, COALESCE(s.status, 'inactive') AS slack_status, COALESCE(t.status, 'inactive') AS teams_status
           FROM organizations o
           LEFT JOIN meta_app_details w ON o.org_id = w.org_id
           LEFT JOIN slack_team_mappings s ON o.org_id = s.org_id
           LEFT JOIN teams_tenant_mappings t ON o.org_id = t.org_id
           WHERE o.org_id = $1 LIMIT 1`,
          [orgDetail.org_id],
        )
        const row = integ.rows[0] || {}
        const channels: string[] = []
        if (row.whatsapp_status) channels.push('whatsapp')
        if (row.slack_status === 'active' || row.slack_status === 'connected') channels.push('slack')
        if (row.teams_status === 'active' || row.teams_status === 'connected') channels.push('teams')

        if (channels.length > 0) {
          await sendUserAdditionMail(name, normalizedEmail, row.qr_code || null, orgDetail.org_id)
        } else {
          // No channels available — do not send invite email
          console.info('No channels connected for org; skipping user addition email for', normalizedEmail)
        }
      } catch (e) {
        console.error('Failed to determine integrations or send user addition email to user:', normalizedEmail, e?.message || e)
      }
    }

    setResponseStatus(event, 201) // User created
    return {
      statusCode: 201,
      status: 'success',
      message: 'User created successfully',
      userId: newUserId,
    }
  } catch (err: any) {
    if (err instanceof CustomError) {
      setResponseStatus(event, err.statusCode)
      return {
        statusCode: err.statusCode,
        status: 'error',
        message: err.message,
      }
    }
    setResponseStatus(event, 500)
    throw new CustomError('Error creating user', 500)
  }
})
