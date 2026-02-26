// server/api/payments/cancel.post.ts
import { defineEventHandler } from 'h3'
import { cancelSubscription } from '~/server/utlis/chargebee'
import { query } from '~/server/utils/db'
import { getOrgFromToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const { orgId, userId, email, role, name } = getOrgFromToken(event)

    // 1️⃣ Fetch active Chargebee subscription
    const orgRes = await query(
        `
            SELECT chargebee_subscription_id
            FROM organizations
            WHERE org_id = $1
            LIMIT 1
        `,
        [orgId]
    )

    const subscriptionId = orgRes.rows[0]?.chargebee_subscription_id
    if (!subscriptionId)
        throw new Error('No active subscription found')

    // 2️⃣ Cancel subscription at end of term
    const result = await cancelSubscription(subscriptionId, true)

    if (result.status !== 'Success') {
        throw new Error(result.error || 'Failed to cancel subscription')
    }

    // ✅ NOW TypeScript knows `data` exists
    const subscription = result.data

    // 3️⃣ Build cancellation metadata
    const cancellationDetails = {
        requested_by: {
            user_id: userId,
            name,
            email,
            role,
        },
        requested_at: new Date().toISOString(),
        cancel_at: subscription.cancel_at,
    }

    // 4️⃣ Merge WITHOUT touching existing metadata
    await query(
        `
            UPDATE subscription_details
            SET
            status = 'cancelled',
            metadata = COALESCE(metadata, '{}'::jsonb)
                || jsonb_build_object('cancellation_details', $1::jsonb)
            WHERE org_id = $2
            AND status = 'active'
        `,
        [JSON.stringify(cancellationDetails), orgId]
    )

    return {
        success: true,
        cancel_at: result.data.cancel_at,
    }
})
