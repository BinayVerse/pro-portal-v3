import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { query } from '~/server/utils/db'
import { verifyTempToken } from '~/server/utils/auth'
import { CustomError } from '~/server/utils/custom.error'
import { logError } from '~/server/utils/logger'
import { isE2ETest } from '~/server/utlis/helper'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { temp_token } = body

    if (!temp_token) {
      throw new CustomError('Temp token is required', 400)
    }

    // 🔐 Verify temp token
    const { user_id } = verifyTempToken(temp_token)

    // 🔍 Fetch user
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
      // fake setup — no QR needed
      await query(
        `UPDATE users 
          SET two_factor_secret = 'E2E_TEST_SECRET',
              two_factor_enabled = true
          WHERE user_id = $1`,
        [user.user_id]
      )

      return {
        status: 'success',
        qrCode: null,
        manualKey: 'E2E_TEST_SECRET',
        test_mode: true
      }
    }

    // 🔐 Generate secret
    const secret = speakeasy.generateSecret({
      name: `Provento (${user.email})`
    })

    // ⚠️ Store secret (NOT enabled yet)
    await query(
      `UPDATE users 
       SET two_factor_secret = $1
       WHERE user_id = $2`,
      [secret.base32, user.user_id]
    )

    // 📷 Generate QR Code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

    setResponseStatus(event, 200)

    return {
      status: 'success',
      qrCode,
      manualKey: secret.base32
    }

  } catch (error: any) {
    logError('2FA Setup Error:', error)

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
      message: 'Failed to setup 2FA'
    }
  }
})
