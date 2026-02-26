import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Determine effective org: prefer query param for superadmin
  let orgId: number
  let userId: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    userId = decodedToken.user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
  if (!userRow?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found', 404)
  }
  const tokenUserOrg = userRow.rows[0].org_id
  const tokenUserRole = userRow.rows[0].role_id

  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

  try {
    // Check if organization exists and has WhatsApp integration
    const orgRes = await query(
      'SELECT qr_code FROM public.organizations WHERE org_id = $1',
      [orgId]
    )

    if (!orgRes?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('Organization not found', 404)
    }

    const qrUrl = orgRes.rows[0].qr_code as string
    if (!qrUrl) {
      setResponseStatus(event, 204) // No Content
      return {
        statusCode: 204,
        status: 'success',
        data: null,
        message: 'QR code not yet generated for this organization. Please configure WhatsApp integration first.',
      }
    }

    // Extract S3 key from URL
    let qrKey: string
    try {
      qrKey = new URL(qrUrl).pathname.slice(1) // remove leading "/"
      if (!qrKey) {
        throw new Error('Invalid QR code URL')
      }
    } catch {
      setResponseStatus(event, 400)
      return {
        statusCode: 400,
        status: 'error',
        data: null,
        message: 'Invalid QR code URL. Could not generate signed link.',
      }
    }

    // Generate signed URL for S3 object
    const s3 = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: config.awsBucketName,
        Key: qrKey,
      }),
      { expiresIn: 86400 } // 1 day
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: signedUrl,
      message: 'WhatsApp QR code fetched successfully.',
    }
  } catch (error: any) {
    if (error instanceof CustomError) {
      setResponseStatus(event, error.statusCode)
      return {
        statusCode: error.statusCode,
        status: 'error',
        message: error.message,
      }
    }
    setResponseStatus(event, 500)
    throw new CustomError('Failed to generate signed URL for WhatsApp QR code.', 500)
  }
})
