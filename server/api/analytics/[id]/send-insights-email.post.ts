// /server/api/analytics/[id]/send-insights-email.post.ts
import { sendEmail } from "../../../utils/ses";
import { defineEventHandler, readBody } from "h3";
import { useRuntimeConfig } from "#imports";
import { query } from '../../../utils/db';

const EMAIL_HEADER = (title: string) => `
  <div style="width:100%;background:#13dcff;color:#fff;padding:18px 0;border-radius:8px 8px 0 0;text-align:center;margin-bottom:16px">
    <div style="max-width:680px;margin:0 auto;padding:0 20px">
      <h1 style="margin:0;font-size:20px">${title}</h1>
    </div>
  </div>
`;

const EMAIL_FOOTER = `
  <div style="max-width:680px;margin:12px auto;text-align:center;color:#9aa4ae;font-size:12px">
    <p style="margin:8px 0">© 2025 provento.ai. All rights reserved.</p>
  </div>
`;

export const sendInsightsEmail = async (
  recipients: Array<{ email: string; name: string }>,
  insightsData: any,
  period: any
) => {
  try {
    const config = useRuntimeConfig();
    const fromEmail = (config as any).sesFromEmailId || 'contact@provento.ai';

    const summary = insightsData?.analytics_summary || {};
    const insights = insightsData?.insights || {};

    const formatList = (items: any[], formatter: (item: any) => string) =>
      items?.length ? items.map(formatter).join("") : "<p>No data available.</p>";

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f6f8;color:#333;">
      <table align="center" width="720" style="background:#ffffff;margin:20px auto;border-radius:10px;overflow:hidden;">
        
        ${EMAIL_HEADER("AI Signals Report")}

        <tr>
          <td style="padding:24px;">
            <p style="font-size:16px;">Dear Team,</p>

            <p>
              Please find below the latest AI-generated Business Insights Report derived from organizational usage analytics.
            </p>

            <h3 style="font-size:18px;margin:20px 0 10px;color:#333;">Analytics Summary (${period.start_date || period.startDate || 'N/A'} → ${period.end_date || period.endDate || 'N/A'})</h3>
            <ul style="margin-bottom:25px;">
              <li><strong>Total Queries:</strong> ${summary.total_queries || 0}</li>
              <li><strong>Active Users:</strong> ${summary.active_users || 0}</li>
              <li><strong>Unique Artifacts:</strong> ${summary.unique_artifacts || 0}</li>
              <li><strong>Total Tokens:</strong> ${summary.total_tokens || 0}</li>
            </ul>

            <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Critical Alerts</h3>
            ${formatList(insights.critical_alerts, (item) => `
              <div style="margin-bottom:16px;padding:16px;background:#fff5f5;border:1px solid #ff4d4f;border-radius:8px;">
                <h3 style="color:#b45309;font-weight:600;margin-bottom:8px;">
                  ${item.title} (${item.severity?.toUpperCase()})
                </h3>
                <p style="font-size:14px;color:#78350f;margin-bottom:6px;">
                  ${item.description}
                </p>
                <p style="font-size:14px;color:#78350f;">
                  <strong>Recommended Action:</strong> ${item.recommended_action}
                </p>
              </div>
            `)}

            <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Content Policy Gaps</h3>
            ${formatList(insights.content_policy_gaps, (item) => `
              <div style="margin-bottom:16px;padding:16px;background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;">
                <h3 style="color:#b45309;font-weight:600;margin-bottom:8px;">
                  ${item.gap_title}
                </h3>
                <p style="font-size:14px;color:#78350f;margin-bottom:6px;">
                  <strong>Evidence:</strong> ${item.evidence}
                </p>
                <p style="font-size:14px;color:#78350f;">
                  <strong>Recommendation:</strong> ${item.recommendation}
                </p>
              </div>
            `)}

            <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Engagement Opportunities</h3>
            ${formatList(insights.engagement_opportunities, (item) => `
              <div style="margin-bottom:16px;padding:16px;background:#ecfdf5;border:1px solid #10b981;border-radius:8px;">
                <h3 style="color:#047857;font-weight:600;margin-bottom:8px;">
                  ${item.opportunity}
                </h3>
                <p style="font-size:14px;color:#065f46;margin-bottom:6px;">
                  <strong>Target:</strong> ${item.target_audience}
                </p>
                <p style="font-size:14px;color:#065f46;">
                  <strong>Impact:</strong> ${item.expected_impact}
                </p>
              </div>
            `)}

            <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Recommended Actions</h3>
            ${formatList(
      (insights.recommended_actions || []).sort(
        (a: any, b: any) => a.priority - b.priority
      ),
      (item) => `
                <div style="margin-bottom:16px;padding:16px;background:#f0f9ff;border:1px solid #1890ff;border-radius:8px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="background:#1890ff20;color:#1890ff;font-size:12px;padding:2px 8px;border-radius:4px;font-weight:600;">
                      P${item.priority}
                    </span>
                    <span style="font-size:14px;color:#374151;padding:2px 8px;">${item.area}</span>
                  </div>
                  <p style="font-size:14px;color:#1e293b;margin-bottom:6px;">
                    <strong>Observation:</strong> ${item.observation}
                  </p>
                  <p style="font-size:14px;color:#1e293b;margin-bottom:6px;">
                    <strong>Action:</strong> ${item.recommended_action}
                  </p>
                  <p style="font-size:13px;color:#64748b;">
                    <strong>Owner:</strong> ${item.owner}
                  </p>
                </div>
              `
    )}

            <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Executive Narrative</h3>
            <div style="background:#fafafa;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                ${insights.chro_executive_narrative || "N/A"}
              </p>
            </div>

            <p style="margin-top:30px;font-size:14px;color:#6b7280;">
              These insights are generated through AI-driven behavioral and content analysis to support proactive, data-backed business decisions.
            </p>

            <p style="margin-top:20px;font-size:14px;">
              Best regards,<br/>
              <strong>provento.ai Team</strong>
            </p>
          </td>
        </tr>

        ${EMAIL_FOOTER}
      </table>
    </body>
    </html>
    `;
    // Send email
    await sendEmail({
      to: recipients.map(r => r.email),
      from: fromEmail,
      subject: "AI Signals Report",
      html: htmlBody,
      text: "AI Signals Report attached in HTML format.",
    });

  } catch (error: any) {
    console.error('Error sending insights email:', error.response?.body || error.message);
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
      console.error("No recipients found!");
      console.error("DB company admins:", dbCompanyAdmins.length);

      throw createError({
        statusCode: 404,
        message: "No recipients found for this organization",
      });
    }

    // Extract insights data
    const insightsResponse = body?.insights || body || {};
    const data = insightsResponse?.data || insightsResponse;
    const period = data.period || body?.period || {};

    // Send the emails using the dedicated function
    await sendInsightsEmail(recipients, data, period);

    return {
      message: `Insights email sent successfully to ${recipients.length} recipient(s)`,
      recipients: recipients.map(r => ({ email: r.email, name: r.name })),
    };

  } catch (error: any) {
    console.error("Error sending insights email:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to send insights email",
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
    console.error("Error fetching company admins from database:", error);
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
    console.error("Error fetching current user:", error);
    return null;
  }
}