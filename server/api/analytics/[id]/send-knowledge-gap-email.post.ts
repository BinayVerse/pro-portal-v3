// /server/api/analytics/[id]/send-knowledge-gap-email.post.ts
import { sendEmail } from "../../../utils/ses";
import { generateKnowledgeGapEmailHTML } from "../../../utils/emailTemplates";
import { defineEventHandler, readBody } from "h3";
import { useRuntimeConfig } from "#imports";
import { query } from '../../../utils/db';
import { logError } from "../../../utils/logger";

export const sendKnowledgeGapEmail = async (
  recipients: Array<{ email: string; name: string }>,
  knowledgeGapData: any,
  period: any
) => {
  try {
    const config = useRuntimeConfig();
    const fromEmail = (config as any).sesFromEmailId || 'contact@provento.ai';

    const htmlBody = generateKnowledgeGapEmailHTML(knowledgeGapData, period);

    // Send email
    await sendEmail({
      to: recipients.map(r => r.email),
      from: fromEmail,
      subject: "Knowledge Enhancement Opportunities Report",
      html: htmlBody,
      text: "Knowledge Enhancement Opportunities Report attached in HTML format.",
    });

  } catch (error: any) {
    logError('Error sending knowledge gap email:', error);
  }
};


export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();

    const body = await readBody(event);

    const urlOrgId = event.context.params?.id;

    const orgId = urlOrgId;

    if (!orgId) {
      throw createError({
        statusCode: 400,
        message: "Organization ID is required",
      });
    }

    const authHeader = event.node.req.headers.authorization;

    if (!authHeader) {
      throw createError({
        statusCode: 401,
        message: "Authorization required",
      });
    }

    // Get the current user info from the token
    const currentUser = await getCurrentUser(authHeader);

    // This is more reliable than the API which might be filtering users
    const dbCompanyAdmins = await fetchCompanyAdminsFromDB(orgId);

    // Combine recipients
    const recipientEmails = new Set<string>();
    const recipients: Array<{ email: string; name: string }> = [];

    // Add current user
    if (currentUser?.email) {
      recipientEmails.add(currentUser.email);
      recipients.push({
        email: currentUser.email,
        name: currentUser.name || currentUser.email.split('@')[0]
      });
    }

    // Add company admins from database
    dbCompanyAdmins.forEach((user: any) => {
      if (!recipientEmails.has(user.email)) {
        recipientEmails.add(user.email);
        recipients.push({
          email: user.email,
          name: user.name || user.email?.split('@')[0] || 'Company Admin'
        });
      }
    });

    if (recipients.length === 0) {
      logError("No recipients found. DB company admins: " + dbCompanyAdmins.length, null);

      throw createError({
        statusCode: 404,
        message: "No recipients found for this organization",
      });
    }

    // Extract knowledge gap data
    const knowledgeGapResponse = body?.knowledgeGap || body || {};
    const data = knowledgeGapResponse?.data || knowledgeGapResponse;
    const period = data.period || body?.period || {};

    // Send the emails using the dedicated function
    await sendKnowledgeGapEmail(recipients, data, period);

    return {
      message: `Knowledge gap email sent successfully to ${recipients.length} recipient(s)`,
      recipients: recipients.map(r => ({ email: r.email, name: r.name })),
    };

  } catch (error: any) {
    logError("Error sending knowledge gap email:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to send knowledge gap email",
    });
  }
});

async function fetchCompanyAdminsFromDB(orgId: string) {
  try {

    const result = await query(
      `SELECT user_id, email, name, role_id 
       FROM users 
       WHERE org_id = $1 AND role_id = 1 AND email IS NOT NULL`,
      [orgId]
    );

    return result.rows.map((row: any) => ({
      email: row.email,
      name: row.name || row.email.split('@')[0],
      user_id: row.user_id,
      role_id: row.role_id
    }));
  } catch (error) {
    logError("Error fetching company admins from database:", error);
    return [];
  }
}

async function getCurrentUser(authHeader: string) {
  try {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase || '/api';

    const response = await $fetch<any>(`${apiBase}/auth/profile`, {
      headers: {
        'Authorization': authHeader
      }
    }).catch(() => null);

    if (response?.data) {
      return {
        email: response.data.email,
        name: response.data.name,
        user_id: response.data.user_id
      };
    }
    return null;
  } catch (error) {
    logError("Error fetching current user:", error);
    return null;
  }
}
