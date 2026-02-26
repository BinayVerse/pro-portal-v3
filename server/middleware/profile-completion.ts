import { H3Event } from 'h3'
import { query } from '../utils/db'
import jwt from 'jsonwebtoken'
import { CustomError } from '../utils/custom.error'

function getToken(event: H3Event): string | null {
  const header = event.node.req.headers['authorization']
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.split(' ')[1]
  }
  try {
    const cookieHeader = String(event.node.req.headers['cookie'] || '')
    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.split('=')
        if (!k) continue
        const key = k.trim()
        const val = decodeURIComponent((v || []).join('=').trim())
        if (key === 'auth-token' || key === 'authToken') return val
      }
    }
  } catch {}
  return null
}

async function isProfileComplete(userId: string): Promise<boolean> {
  const userQuery = `
    SELECT u.name, u.contact_number, u.org_id
    FROM users u
    WHERE u.user_id = $1
  `
  const result = await query(userQuery, [userId])
  if (!result?.rows?.length) return false
  const row = result.rows[0]
  return !!(row.name && row.contact_number && row.org_id)
}

const ALLOWLIST_PREFIXES = [
  // Health and public endpoints (adjust as needed)
]

const ALLOWLIST_PATHS = new Set<string>([
  // Auth-related endpoints must remain accessible
  '/api/auth/google-signin',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/profile', // needed to fetch current user
  '/api/auth/profile-update', // needed to complete profile
  '/api/auth/reset-password',
  '/api/auth/update-password',
  '/api/verifyenv',
  '/api/contact',
])

export default defineEventHandler(async (event) => {
  // Only enforce for API routes
  const path = event.path || event.node.req.url || ''
  if (!path.startsWith('/api')) return

  // Skip allowlisted endpoints
  if (ALLOWLIST_PATHS.has(path) || ALLOWLIST_PREFIXES.some(p => path.startsWith(p))) return

  // Require valid auth token to check profile completion; if no token, 
  // let underlying handlers decide (401/403). Our concern is only blocking
  // authenticated users with incomplete profiles from other APIs.
  const config = useRuntimeConfig()
  const token = getToken(event)
  if (!token) return

  let userId: string | null = null
  try {
    const decoded = jwt.verify(token, config.jwtToken as string) as any
    userId = decoded?.user_id || null
  } catch {
    return // invalid token; underlying route can handle auth
  }

  if (!userId) return

  const complete = await isProfileComplete(userId)
  if (!complete) {
    throw new CustomError('Please complete your profile to access the application.', 403)
  }
})
