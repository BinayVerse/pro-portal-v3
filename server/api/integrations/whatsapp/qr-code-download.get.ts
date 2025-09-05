import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let orgId: number
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { org_id: number }
    orgId = decodedToken.org_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    const orgRes = await query('SELECT qr_code FROM public.organizations WHERE org_id = $1', [orgId])
    if (!orgRes?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('Organization not found', 404)
    }

    const qrUrl = orgRes.rows[0].qr_code as string
    if (!qrUrl) {
      setResponseStatus(event, 204)
      return {
        statusCode: 204,
        status: 'success',
        data: null,
        message: 'QR code not yet generated for this organization.',
      }
    }

    // Extract S3 key
    let qrKey: string
    try {
      qrKey = new URL(qrUrl).pathname.slice(1)
      if (!qrKey) throw new Error('Invalid QR code URL')
    } catch (err) {
      setResponseStatus(event, 400)
      return {
        statusCode: 400,
        status: 'error',
        data: null,
        message: 'Invalid QR code URL. Could not fetch object.',
      }
    }

    const s3 = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    })

    const getCmd = new GetObjectCommand({ Bucket: config.awsBucketName, Key: qrKey })
    const res = await s3.send(getCmd)

    // Body can be stream or Uint8Array
    const body = res.Body as any
    let buffer: Buffer
    if (body instanceof Uint8Array) {
      buffer = Buffer.from(body)
    } else if (body?.readable) {
      // Node readable stream
      const chunks: Buffer[] = []
      for await (const chunk of body) {
        chunks.push(Buffer.from(chunk))
      }
      buffer = Buffer.concat(chunks)
    } else {
      // Fallback
      buffer = Buffer.from('')
    }

    const base64 = buffer.toString('base64')
    const contentType = (res.ContentType as string) || 'application/octet-stream'

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: {
        base64,
        contentType,
      },
      message: 'QR code fetched via proxy',
    }
  } catch (error: any) {
    console.error('Error in qr-code-download:', error)
    if (error instanceof CustomError) {
      setResponseStatus(event, error.statusCode)
      return {
        statusCode: error.statusCode,
        status: 'error',
        message: error.message,
      }
    }
    setResponseStatus(event, 500)
    throw new CustomError('Failed to fetch QR code via proxy', 500)
  }
})
