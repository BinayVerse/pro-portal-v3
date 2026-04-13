import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import speakeasy from 'speakeasy'
import jwt from 'jsonwebtoken'
import { query } from '~/server/utils/db'
import { verifyTempToken } from '~/server/utils/auth'
import { CustomError } from '~/server/utils/custom.error'
import { isE2ETest } from '~/server/utlis/helper'

const MAX_ATTEMPTS = 5
const LOCK_TIME_MINUTES = 15

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

    // ✅ TEST BYPASS (E2E)
    if (isE2ETest(event)) {
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

    // 🔒 CHECK LOCK
    if (user.two_factor_locked_until) {
      let message = ''
      const now = new Date()
      const lockedUntil = new Date(user.two_factor_locked_until)

      if (lockedUntil > now) {
        const diffMs = lockedUntil.getTime() - now.getTime()

        const remainingMinutes = Math.ceil(diffMs / (1000 * 60))
        const remainingSeconds = Math.ceil(diffMs / 1000)

        if (remainingMinutes < 60) {
          message = `Please try again after ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
        } else if (remainingSeconds < 60) {
          message = `Please try again after ${remainingSeconds} seconds`
        } else {
          message = `Please try again later`
        }

        throw new CustomError(
          `Your account has been locked after ${MAX_ATTEMPTS} failed login attempts. ${message}`,
          403
        )
      } else {
        // ✅ LOCK EXPIRED → RESET USER STATE
        await query(
          `UPDATE users 
            SET two_factor_failed_attempts = 0,
                two_factor_locked_until = NULL
            WHERE user_id = $1`,
          [user.user_id]
        )

        // also update local object to avoid stale values
        user.two_factor_failed_attempts = 0
        user.two_factor_locked_until = null
      }
    }

    // 🔐 VERIFY OTP
    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: otp,
      window: 1
    })

    // ❌ INVALID OTP
    if (!isValid) {
      const attempts = (user.two_factor_failed_attempts || 0) + 1

      let lockedUntil = null

      if (attempts >= MAX_ATTEMPTS) {
        lockedUntil = new Date()
        lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_TIME_MINUTES)

        await query(
          `UPDATE users 
            SET two_factor_failed_attempts = $1,
                two_factor_locked_until = $2
            WHERE user_id = $3`,
          [attempts, lockedUntil, user.user_id]
        )

        throw new CustomError(
          `Your account has been locked after ${MAX_ATTEMPTS} failed login attempts. Please try again after ${LOCK_TIME_MINUTES} minutes.`,
          403
        )
      }

      await query(
        `UPDATE users 
          SET two_factor_failed_attempts = $1
          WHERE user_id = $2`,
        [attempts, user.user_id]
      )

      throw new CustomError('Invalid OTP', 400)
    }

    // ✅ SUCCESS → RESET ATTEMPTS
    await query(
      `UPDATE users 
       SET two_factor_failed_attempts = 0,
           two_factor_locked_until = NULL
       WHERE user_id = $1`,
      [user.user_id]
    )

    // ✅ ISSUE JWT
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
    console.error('2FA Verify Error:', error)

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
      message: 'Something went wrong'
    }
  }
})