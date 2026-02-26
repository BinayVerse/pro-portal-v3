import { defineEventHandler, readBody, createError } from 'h3'
import { activateFreePlanForOrg } from '../../utils/dbHelpers'

export default defineEventHandler(async (event) => {
    const { planId, metadata, billing } = await readBody(event)

    if (!planId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Plan Id is required',
        })
    }

    const res = await activateFreePlanForOrg(event, planId, metadata || {}, billing || {})

    if (!res.success) {
        throw createError({
            statusCode: 400,
            statusMessage: res.error || 'Free plan activation failed',
        })
    }

    return { success: true }
})
