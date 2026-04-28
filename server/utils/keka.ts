import axios from 'axios'
import { CustomError } from './custom.error'
import { logError, logWarn } from './logger'

interface KekaTokenCache {
  token: string
  expiresAt: number
}

// In-memory token cache (24 hours)
const tokenCache: Map<string, KekaTokenCache> = new Map()
const TOKEN_VALIDITY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Generate a new Keka API token
 * Uses client_id, client_secret, and api_key to authenticate with Keka
 */
export async function generateKekaToken(): Promise<string> {
  const config = useRuntimeConfig()

  const clientId = config.kekaClientId
  const clientSecret = config.kekaClientSecret
  const apiKey = config.kekaApiKey
  const kekaLoginUrl = config.kekaLoginUrl

  if (!clientId || !clientSecret || !apiKey || !kekaLoginUrl) {
    logError('Missing Keka credentials', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasApiKey: !!apiKey,
      hasLoginUrl: !!kekaLoginUrl,
    })
    throw new CustomError('Keka credentials not configured', 500)
  }

  try {
    // Construct the token endpoint URL
    const tokenUrl = kekaLoginUrl.endsWith('/') ? `${kekaLoginUrl}connect/token` : `${kekaLoginUrl}/connect/token`

    const params = new URLSearchParams({
      grant_type: 'kekaapi',
      scope: 'kekaapi',
      client_id: clientId,
      client_secret: clientSecret,
      api_key: apiKey,
    })

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    })

    if (!response.data?.access_token) {
      logError('Invalid Keka response:', response.data)
      throw new CustomError('Invalid Keka token response', 500)
    }
    return response.data.access_token
  } catch (error: any) {
    logError('Keka error response:', error?.response?.data)
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || 'Failed to generate Keka token'

    logError('Keka token generation error:', {
      status,
      message,
      url: error?.config?.url,
    })

    throw new CustomError(`Keka token generation failed: ${message}`, 500)
  }
}

/**
 * Get valid Keka token with caching
 * Returns cached token if valid, otherwise generates a new one
 */
export async function getKekaToken(): Promise<string> {
  const cacheKey = 'keka_api_token'
  const cached = tokenCache.get(cacheKey)

  // Check if cached token is still valid
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token
  }

  // Generate new token
  const newToken = await generateKekaToken()

  // Cache for 24 hours
  tokenCache.set(cacheKey, {
    token: newToken,
    expiresAt: Date.now() + TOKEN_VALIDITY,
  })

  return newToken
}

/**
 * Invalidate cached token (useful after token errors)
 */
export function invalidateKekaToken(): void {
  tokenCache.delete('keka_api_token')
}

/**
 * Fetch attendance records from Keka API
 */
export async function getKekaAttendanceData(params: {
  fromDate: string // YYYY-MM-DD
  toDate: string // YYYY-MM-DD
  employeeIds?: string[]
  limit?: number
  offset?: number
}): Promise<any> {
  const config = useRuntimeConfig()
  const kekaBaseUrl = config.kekaBaseUrl

  if (!kekaBaseUrl) {
    logError('Keka base URL not configured', null)
    throw new CustomError('Keka base URL not configured', 500)
  }

  // console.log('Fetching attendance data from Keka:', {
  //   fromDate: params.fromDate,
  //   toDate: params.toDate,
  //   employeeIds: params.employeeIds,
  // })

  const token = await getKekaToken()

  try {
    // Convert dates to ISO 8601 format for Keka API
    const fromDateTime = new Date(params.fromDate)
    fromDateTime.setHours(0, 0, 0, 0)
    const toDateTime = new Date(params.toDate)
    toDateTime.setHours(23, 59, 59, 999)

    // Build query parameters
    const queryParams = new URLSearchParams({
      from: fromDateTime.toISOString(),
      to: toDateTime.toISOString(),
      limit: String(params.limit || 100),
      offset: String(params.offset || 0),
      pageSize: String(params.limit || 200),
    })

    if (params.employeeIds && params.employeeIds.length > 0) {
      queryParams.append('employeeIds', params.employeeIds.join(','))
    }

    const url = `${kekaBaseUrl}/api/v1/time/attendance?${queryParams.toString()}`
    // console.log('Attendance API URL:', url)
    // console.log('Date range sent to Keka:', {
    //   from: queryParams.get('from'),
    //   to: queryParams.get('to'),
    // })

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })

    return response.data
  } catch (error: any) {
    logError('Attendance API error:', error)

    // If token is invalid, invalidate cache and retry once
    if (error?.response?.status === 401) {
      logWarn('Token expired (401), retrying with new token...')
      invalidateKekaToken()

      try {
        const newToken = await getKekaToken()

        const queryParams = new URLSearchParams({
          from_date: params.fromDate,
          to_date: params.toDate,
          limit: String(params.limit || 100),
          offset: String(params.offset || 0),
        })

        if (params.employeeId) {
          queryParams.append('employee_id', params.employeeId)
        }

        const url = `${kekaBaseUrl}/time-attendance?${queryParams.toString()}`

        const retryResponse = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        })

        logWarn('Retry successful, records: ' + (retryResponse.data?.data?.length || 0))
        return retryResponse.data
      } catch (retryError: any) {
        const retryMessage = retryError?.response?.data?.message || retryError?.message || 'Retry failed'
        logError('Retry failed:', retryError)
        throw new CustomError(`Keka API error after retry: ${retryMessage}`, retryError?.response?.status || 500)
      }
    }

    const message = error?.response?.data?.message || error?.message || 'Failed to fetch attendance data'
    throw new CustomError(`Keka API error: ${message}`, error?.response?.status || 500)
  }
}
