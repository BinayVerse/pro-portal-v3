import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { CustomError } from '../../utils/custom.error';
import { query } from '../../utils/db';
import { generateResetLink, sendResetPasswordMail } from '../helper';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      throw new CustomError('Email is required', 400);
    }

    const result = await query(
      'SELECT user_id, name, role_id FROM users WHERE email = $1 AND role_id IN (0, 1, 3)',
      [email]
    );

    if (result.rowCount === 0) {
      throw new CustomError('User with this email does not exist or lacks admin access', 404);
    }

    const { user_id, name, role_id } = result.rows[0];

    if (role_id === 2) {
      throw new CustomError(
        'Your account requires admin access. Please contact the admin for further assistance.',
        403
      );
    }

    const { resetLink } = await generateResetLink(email, config.public.appUrl, user_id);
    await sendResetPasswordMail(name, email, resetLink);

    setResponseStatus(event, 201);

    return {
      statusCode: 201,
      status: 'success',
      message: 'Password reset email sent successfully',
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof CustomError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'An unknown error occurred';

    throw new CustomError(errorMessage, 500);
  }
});
