import jwt from 'jsonwebtoken'
import { H3Event } from 'h3'
import { CustomError } from './custom.error'

export function getCurrentUserId(event: H3Event): any {
  const token = event.node?.req?.headers?.['authorization']?.split?.(' ')[1]
  if (!token) {
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtToken as string) as { user_id?: any }
    if (!decoded || typeof decoded.user_id === 'undefined') {
      throw new CustomError('Unauthorized: Invalid token payload', 401)
    }
    return decoded.user_id
  } catch (err) {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }
}


export function getOrgFromToken(event: H3Event): { orgId: string; userId?: string, email?: string; role?: number; name?: string } {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: No token provided' })
  }

  try {
    const decoded: any = jwt.verify(token, config.jwtToken as string)
    const orgId = decoded?.org_id
    const userId = decoded?.user_id
    const email = decoded?.email
    const role = decoded?.role_id
    const name = decoded?.name

    if (!orgId) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid token: org_id missing' })
    }

    return { orgId, userId, email, role, name }
  } catch (err) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid token' })
  }
}
