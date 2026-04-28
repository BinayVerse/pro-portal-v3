import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import speakeasy from 'speakeasy'
import jwt from 'jsonwebtoken'
import { query } from '~/server/utils/db'
import { verifyTempToken } from '~/server/utils/auth'
import { CustomError } from '~/server/utils/custom.error'
import { logError } from '~/server/utils/logger'
import { isE2ETest } from '~/server/utlis/helper'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const secret = config.jwtToken as string

    try {
        const body = await readBody(event)
        const { temp_token, otp } = body

        if (!temp_token || !otp) {
            throw new CustomError('Missing fields', 400)
        }

        const { user_id } = verifyTempToken(temp_token)

        const userResult = await query(
            'SELECT * FROM users WHERE user_id = $1',
            [user_id]
        )

        if (!userResult?.rows?.length) {
            throw new CustomError('User not found', 404)
        }

        const user = userResult.rows[0]

        if (!user.two_factor_secret) {
            throw new CustomError('2FA not initialized', 400)
        }

        // ✅ TEST BYPASS (E2E)
        if (isE2ETest(event)) {
            await query(
                `UPDATE users 
                    SET two_factor_enabled = true,
                        two_factor_failed_attempts = 0
                    WHERE user_id = $1`,
                [user.user_id]
            )

            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                    org_id: user.org_id,
                },
                secret,
                { expiresIn: '1h' }
            )

            return {
                status: 'success',
                access_token: token,
                user,
                test_mode: true
            }
        }

        const isValid = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: otp,
            window: 1
        })

        if (!isValid) {
            throw new CustomError('Invalid OTP', 400)
        }

        // ✅ Enable 2FA
        await query(
            `UPDATE users 
       SET two_factor_enabled = true,
           two_factor_failed_attempts = 0
       WHERE user_id = $1`,
            [user.user_id]
        )

        // ✅ Issue JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                org_id: user.org_id,
            },
            secret,
            { expiresIn: '1h' }
        )

        setResponseStatus(event, 200)

        return {
            status: 'success',
            access_token: token,
            user
        }

    } catch (error: any) {
        logError('2FA Verify Setup Error:', error)

        if (error instanceof CustomError) {
            setResponseStatus(event, error.statusCode)
            return {
                status: 'error',
                message: error.message
            }
        }

        setResponseStatus(event, 500)
        return {
            status: 'error',
            message: 'Failed to verify 2FA setup'
        }
    }
})
