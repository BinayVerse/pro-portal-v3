import { defineEventHandler, readBody, setResponseStatus, getQuery } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { uploadBulkUserValidation } from '~/server/utils/validations'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'

interface User {
  Name: string
  Email: string
  'Whatsapp Number': string
  Role: string
  error?: string
  rowNumber?: number
  rowIndex?: number
  invalidFields?: { field: string; message: string }[]
}

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

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
      `SELECT user_id, org_id, role_id FROM users WHERE user_id = $1`,
      [userId],
    )
    if (userResult.rows.length === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }

    // Allow superadmin override via query or body.org_id
    const q = getQuery(event) as Record<string, any>
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
      `SELECT org_id FROM organizations WHERE org_id = $1`,
      [effectiveOrgId],
    )
    if (orgResult.rows.length === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('Organization not found', 404)
    }

    if (!Array.isArray(body)) {
      setResponseStatus(event, 400)
      throw new CustomError('Expected an array of users', 400)
    }

    const emailSet = new Set<string>()
    const contactNumberSet = new Set<string>()
    const failedUsers: User[] = []
    const validUsers: any[] = []

    const expectedKeys = ['Name', 'Email', 'Whatsapp Number', 'Role']
    const headers = Object.keys(body[0])

    const unexpectedHeaders = headers.filter((header) => !expectedKeys.includes(header))
    if (unexpectedHeaders.length > 0) {
      setResponseStatus(event, 422)
      return {
        status: false,
        errors: unexpectedHeaders.map((header) => ({
          column: header,
          error: `Invalid headers found: ${unexpectedHeaders.join(', ')}`,
        })),
      }
    }

    for (let index = 0; index < body.length; index++) {
      const row = body[index]
      const rowErrors: { field: string; message: string }[] = []
      const rowNumber = index + 1
      const rowIndex = index

      // Zod safeParse instead of Joi validate
      const result = uploadBulkUserValidation.safeParse(row)

      if (!result.success) {
        // Collect Zod errors
        result.error.errors.forEach((err) => {
          rowErrors.push({
            field: err.path[0]?.toString() || 'unknown',
            message: err.message,
          })
        })
      } else {
        // Valid row data
        const { Name, Email, 'Whatsapp Number': contactNumber, Role } = result.data

        const normalizedEmail = Email ? String(Email).toLowerCase() : null

        // Check duplicate emails within file
        if (normalizedEmail) {
          if (emailSet.has(normalizedEmail)) {
            rowErrors.push({ field: 'Email', message: `Duplicate Email: ${Email} already present in CSV File` })
          } else {
            emailSet.add(normalizedEmail)
          }
        }

        // Check duplicate WhatsApp numbers within file
        if (contactNumber) {
          if (contactNumberSet.has(contactNumber)) {
            rowErrors.push({ field: 'Whatsapp Number', message: `Duplicate Whatsapp Number: ${contactNumber} already present in CSV File` })
          } else {
            contactNumberSet.add(contactNumber)
          }
        }

        // If still no errors, run DB-level checks for the effectiveOrgId
        if (rowErrors.length === 0) {
          try {
            // If assigning admin role, ensure this email is not already admin of another org
            const roleLower = Role ? String(Role).trim().toLowerCase() : ''
            if (roleLower === 'admin' && normalizedEmail) {
              const adminCheck = await query(
                `SELECT o.org_name FROM users u JOIN organizations o ON u.org_id = o.org_id WHERE u.email = $1 AND u.role_id = 1 LIMIT 1`,
                [normalizedEmail],
              )
              if (adminCheck.rows.length > 0) {
                rowErrors.push({ field: 'Email', message: `Cannot assign the admin role, already admin of ${adminCheck.rows[0].org_name}` })
              }
            }

            // Check duplicates inside the target organization
            const duplicateCheck = await query(
              `SELECT email, contact_number FROM users WHERE (email = $1 OR contact_number = $2) AND org_id = $3 LIMIT 1`,
              [normalizedEmail, contactNumber || null, effectiveOrgId],
            )

            if (duplicateCheck.rows.length > 0) {
              const existingUser = duplicateCheck.rows[0]
              if (existingUser.email && normalizedEmail && existingUser.email === normalizedEmail) {
                rowErrors.push({ field: 'Email', message: `${Email} is already in use in this organization` })
              }
              if (existingUser.contact_number && contactNumber && existingUser.contact_number === contactNumber) {
                rowErrors.push({ field: 'Whatsapp Number', message: `${contactNumber} is already in use in this organization` })
              }
            }
          } catch (e: any) {
            // DB error — mark as failed for this row
            rowErrors.push({ field: 'Database', message: `Database error: ${e?.message || e}` })
          }
        }

        // If still no errors, mark as valid (preview)
        if (rowErrors.length === 0) {
          validUsers.push({ Name, Email: normalizedEmail, contactNumber, Role, rowNumber, rowIndex })
        }
      }

      if (rowErrors.length > 0) {
        failedUsers.push({ ...row, rowNumber, rowIndex, invalidFields: rowErrors })
      }
    }

    const hasErrorOccurred = failedUsers.length > 0

    if (hasErrorOccurred) {
      setResponseStatus(event, 422)
    } else {
      setResponseStatus(event, 200)
    }

    return {
      statusCode: hasErrorOccurred ? 422 : 200,
      status: !hasErrorOccurred,
      message: hasErrorOccurred ? 'Validation failed for some users' : 'CSV processed successfully',
      errors: failedUsers,
      data: {
        total_rows: body.length,
        valid_rows: validUsers.length,
        invalid_rows: failedUsers.length,
        valid_preview: validUsers.slice(0, 100),
      },
      // include the effectiveOrgId so callers (or logs) can confirm which org was used
      org_id: effectiveOrgId,
    }
  } catch (error: any) {
    console.error('upload-json handler error:', error)
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
      message: 'An unexpected error occurred while processing CSV',
    }
  }
})
