import { query } from "~/server/utils/db";
import jwt from 'jsonwebtoken'
import { logError } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    // Verify authorization

    const config = useRuntimeConfig()

    const headerAuth = (event.node.req.headers['authorization'] as string) || ''
    const tokenFromHeader = headerAuth.startsWith('Bearer ')
      ? headerAuth.split(' ')[1]
      : headerAuth || undefined

    // Parse cookies
    const cookieHeader = String(event.node.req.headers['cookie'] || '')
    const parsedCookies: Record<string, string> = {}

    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.split('=')
        if (!k) continue
        parsedCookies[k.trim()] = decodeURIComponent((v || []).join('=').trim())
      }
    }

    const tokenCookie =
      parsedCookies['auth-token'] ||
      parsedCookies['authToken'] ||
      undefined

    const token = tokenFromHeader || tokenCookie

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: No token provided",
      })
    }

    try {
      jwt.verify(token as string, config.jwtToken as string)
    } catch (err) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Invalid token",
      })
    }

    const body = await readBody(event);

    const {
      org_id,
      user_id,
      channel,
      message_id,
      question_text,
      answer_text,
      feedback,
      reason,
      comment,
      retrieved_context,
      reframed_question,
    } = body;

    // Validate required fields
    if (!org_id || !user_id || !channel || !feedback) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields",
      });
    }

    // Validate feedback value
    if (!["helpful", "not_helpful"].includes(feedback)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid feedback value",
      });
    }

    // Validate channel
    if (!["whatsapp", "slack", "teams", "admin"].includes(channel)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid channel",
      });
    }

    // Validate reason if provided (only for not_helpful)
    if (feedback === "not_helpful" && reason) {
      const validReasons = [
        "incorrect_answer",
        "irrelevant_answer",
        "incomplete",
      ]

      // normalize
      const normalizedReason = reason?.trim()

      if (feedback === "not_helpful" && normalizedReason) {
        if (!validReasons.includes(normalizedReason)) {
          throw createError({
            statusCode: 400,
            statusMessage: "Invalid reason",
          })
        }
      }
    }

    // Insert feedback record
    const result = await query(
      `INSERT INTO public.message_feedback 
       (org_id, user_id, channel, message_id, question_text, answer_text, feedback, reason, comment, created_at, retrieved_context, reframed_question)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11)
       RETURNING id`,
      [
        org_id,
        user_id,
        channel,
        message_id || null,
        question_text || null,
        answer_text || null,
        feedback,
        reason || null,
        comment || null,
        retrieved_context ? JSON.stringify(retrieved_context) : null,
        reframed_question || null,
      ]
    );

    return {
      success: true,
      message: "Feedback recorded successfully",
      feedback_id: result.rows[0]?.id,
    };
  } catch (error: any) {
    logError("Error recording feedback:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to record feedback",
    });
  }
});
