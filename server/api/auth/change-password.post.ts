import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendPasswordUpdatedMail } from '../helper'
import { getPasswordRegex } from '../../utils/validations'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { userId, currentPassword, newPassword } = body || {}

    if (!userId || !newPassword) {
      throw new CustomError('User ID and new password are required', 400)
    }

    const cleanPassword = String(newPassword).trim()

    if (!getPasswordRegex().test(cleanPassword)) {
      throw new CustomError(
        'Password must contain at least one uppercase, lowercase, special character, and digit with a minimum of 8 characters. The characters ", \\\', <, >, `, \\ are prohibited.',
        400
      )
    }

    // Verify auth token and ensure the requester matches the userId
    const config = useRuntimeConfig()
    const token = event.node.req.headers['authorization']?.split?.(' ')[1]
    if (!token) {
      throw new CustomError('Unauthorized: No token provided', 401)
    }

    let tokenUserId: string
    try {
      const decoded = jwt.verify(token, config.jwtToken as string) as any
      tokenUserId = decoded?.user_id
    } catch (err) {
      throw new CustomError('Unauthorized: Invalid token', 401)
    }

    if (!tokenUserId || String(tokenUserId) !== String(userId)) {
      throw new CustomError('Forbidden: You can only change your own password', 403)
    }

    // Fetch user
    const result = await query('SELECT * FROM users WHERE user_id = $1', [userId])
    if (!result?.rows?.length) {
      throw new CustomError('User not found', 404)
    }

    const user = result.rows[0]
    const { name, email, password: storedPassword } = user

    // If user has an existing password, require currentPassword and validate
    if (storedPassword && storedPassword.length > 0) {
      if (!currentPassword) {
        throw new CustomError('Current password is required', 400)
      }

      const isCurrentValid = await bcrypt.compare(String(currentPassword), storedPassword)
      if (!isCurrentValid) {
        throw new CustomError('Current password is incorrect', 403)
      }

      // Disallow reusing the same password
      const isSameAsOld = await bcrypt.compare(cleanPassword, storedPassword)
      if (isSameAsOld) {
        throw new CustomError('You cannot reuse your last password', 400)
      }
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10)

    const updateResult = await query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, userId])

    if (updateResult.rowCount === 0) {
      throw new CustomError('Failed to update password. Please try again later.', 500)
    }

    try {
      await sendPasswordUpdatedMail(name, email)
    } catch (err) {
      // Log and continue — password was updated
      console.error('Failed to send password updated email:', err)
    }

    setResponseStatus(event, 201)
    return {
      statusCode: 201,
      status: 'success',
      message: 'Password changed successfully',
    }
  } catch (error: any) {
    console.error(error)
    if (error instanceof CustomError) {
      throw error
    }
    throw new CustomError(error?.message || 'An error occurred while changing password.', 500)
  }
})
