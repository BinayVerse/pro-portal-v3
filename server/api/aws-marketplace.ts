// server/api/aws-marketplace.ts
import {
    defineEventHandler,
    getQuery,
    readBody,
    setCookie,
    sendRedirect,
    H3Event
} from 'h3'
import { query } from '~/server/utils/db'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event: H3Event) => {
    const queryParams = getQuery(event) || {}

    let body: any = {}
    try {
        body = await readBody(event)
    } catch { }

    const token =
        body?.['x-amzn-marketplace-token'] ||
        body?.['x_amzn_marketplace_token'] ||
        body?.['x_amzn-marketplace-token'] ||
        queryParams?.['x-amzn-marketplace-token'] ||
        queryParams?.['x_amzn_marketplace_token'] ||
        queryParams?.['x_amzn-marketplace-token'] ||
        null

    if (!token) {
        return { message: 'No marketplace token found' }
    }

    // 1️⃣ Validate token with AWS (ONE TIME)
    const fulfillmentRes = await processFulfillment(token)
    const customerId = fulfillmentRes?.data?.customerId

    if (!customerId) {
        return sendRedirect(event, '/signup', 302)
    }

    // 2️⃣ If already linked → login
    const existing = await query(
        `
    SELECT org_id, active
    FROM aws_marketplace_subscriptions
    WHERE customer_id = $1
    LIMIT 1
    `,
        [customerId]
    )

    if (existing.rows[0]?.org_id && existing.rows[0]?.active) {
        return sendRedirect(event, '/login', 302)
    }

    // 3️⃣ Create server-side session (2 hours)
    const sessionToken = randomUUID()

    await query(
        `
    INSERT INTO aws_marketplace_sessions
      (customer_id, session_token, expires_at)
    VALUES
      ($1, $2, now() + interval '2 hours')
    `,
        [customerId, sessionToken]
    )

    // 4️⃣ Set HttpOnly cookie
    setCookie(event, 'aws_marketplace_session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 2 // 2 hours
    })

    // 5️⃣ Redirect WITHOUT token, but add AWS flow indicator
    return sendRedirect(event, '/signup?from=aws', 302)
})
