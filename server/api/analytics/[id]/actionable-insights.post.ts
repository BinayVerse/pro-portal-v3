// server/api/analytics/[id]/actionable-insights.post.ts

import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import axios from 'axios'
import { CustomError } from '~/server/utils/custom.error'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const botEndpoint = config.public.botEndpoint

    const body = await readBody(event)

    const token = event.node.req.headers['authorization']

    if (!token) {
      throw new CustomError('Unauthorized', 401)
    }

    const apiUrl = `${botEndpoint}api/dashboard/actionable-insights`

    const response = await axios.post(apiUrl, body, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    })

    return response.data

  } catch (error: any) {
    console.error('Actionable Insights Error:', error?.response?.data || error.message)

    setResponseStatus(event, error?.response?.status || 500)

    return {
      status: 'error',
      message:
        error?.response?.data?.message ||
        error.message ||
        'Failed to fetch actionable insights',
    }
  }
})