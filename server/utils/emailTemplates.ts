// server/utils/emailTemplates.ts

export const EMAIL_HEADER = (title: string, bgColor: string = '#13dcff') => `
  <div style="width:100%;background:${bgColor};color:#fff;padding:18px 0;border-radius:8px 8px 0 0;text-align:center;margin-bottom:16px">
    <div style="max-width:680px;margin:0 auto;padding:0 20px">
      <h1 style="margin:0;font-size:20px">${title}</h1>
    </div>
  </div>
`;

export const SECOND_EMAIL_HEADER = (title: string, bgColor: string = '#13dcff') => `
  <div style="width:auto;background:${bgColor};color:#fff;padding:18px 0;border-radius:0 0 8px 8px;text-align:center;margin:-25px -25px 25px;">
    <div style="max-width:680px;margin:0 auto;padding:0 20px">
      <h1 style="margin:0;font-size:20px">${title}</h1>
    </div>
  </div>
`;

export const EMAIL_FOOTER = `
  <div style="max-width:680px;margin:12px auto;text-align:center;color:#9aa4ae;font-size:12px">
    <p style="margin:8px 0">© 2025 provento.ai. All rights reserved.</p>
  </div>
`;

export const formatList = (items: any[], formatter: (item: any) => string) =>
  items?.length ? items.map(formatter).join("") : "<p>No data available.</p>";

// 🔹 Section Block (title + description)
export const sectionBlock = (title: string, desc: string) => `
  <table width="100%" style="margin-bottom:20px;border-collapse:collapse;">
    <tr>
      <td style="font-size:16px;font-weight:600;padding-bottom:4px;">
        ${title}
      </td>
    </tr>
    <tr>
      <td style="font-size:15px;line-height:1.5;color:#374151;">
        ${desc}
      </td>
    </tr>
  </table>
`;

// 🔹 Simple paragraph
export const textBlock = (text: string) => `
  <p style="margin:0 0 16px;line-height:1.5;">
    ${text}
  </p>
`;

// 🔹 CTA link (inline style)
export const linkBlock = (text: string, url: string) => `
  <a href="${url}" style="color:#15c;text-decoration:none;font-weight:500;">
    ${text}
  </a>
`;

// 🔹 Bullet list (email-safe)
export const listBlock = (items: string[]) => `
  <table width="100%" style="margin:10px 0 20px;">
    ${items
    .map(
      (item) => `
        <tr>
          <td style="font-size:15px;padding:4px 0;">
            • ${item}
          </td>
        </tr>
      `
    )
    .join('')}
  </table>
`;

export const CTA_BUTTON = (text: string, url: string) => `
  <table width="100%" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${url}"
           style="background:#22d3ee;
                  color:#000;
                  padding:12px 22px;
                  border-radius:8px;
                  text-decoration:none;
                  font-weight:600;
                  display:inline-block;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

const LINKEDIN_ICON = `
  <a href="http://linkedin.com/company/provento-ai"
     target="_blank"
     style="display:inline-block;margin:0 6px;">

    <img
      src="https://provento-public-logo.s3.us-east-1.amazonaws.com/Linked-In-logo.png"
      width="28"
      height="28"
      alt="LinkedIn"
      style="display:block;border-radius:4px;"
    />

  </a>
`;

export const getEmailLayout = (content: string,
  options?: {
    subHeader?: {
      title: string;
      bgColor?: string;
    };
  }) => {
  const config = useRuntimeConfig();
  const LOGO_URL = `https://provento-public-logo.s3.us-east-1.amazonaws.com/provento-logo.png`;
  const LOGO_TEXT_URL = `https://provento-public-logo.s3.us-east-1.amazonaws.com/provento-logo-with-text.png`;

  const subHeaderHTML = options?.subHeader
    ? `
    <tr>
      <td style="background:${options.subHeader.bgColor || '#13dcff'};color:#fff;text-align:center;padding:18px 20px;">
        <h1 style="margin:0;font-size:20px;">
          ${options.subHeader.title}
        </h1>
      </td>
    </tr>
  `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:10px;overflow:hidden;
                    box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td align="center" style="padding:20px;border-bottom:1px solid #e5e7eb;">
                  <img
                    src="${LOGO_TEXT_URL}"
                    alt="provento.ai"
                    width="100"
                    style="display:block;margin:auto;"
                  />
                </td>
              </tr>

              ${subHeaderHTML}

              <!-- Content -->
              <tr>
                <td style="padding:24px;color:#333;font-size:15px;line-height:1.6;">
                  ${content}
                  <p style="font-size: 16px; line-height: 1.5; margin: 0; padding-top: 30px;">Cheers,</p>
                  <p style="font-size: 16px; line-height: 1.5; margin: 0;"><strong>The provento.ai Team</strong></p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="padding:30px 20px;border-top:1px solid #e5e7eb;background:#f9fafb;">

                  <!-- Logo -->
                  <div style="margin-bottom:12px;">
                    <img
                      src="${LOGO_URL}"
                      height="32"
                      alt="provento.ai"
                      style="display:block;margin:auto;"
                    />
                  </div>

                  <!-- Copyright -->
                  <p style="margin:0 0 14px;color:#6b7280;font-size:12px;">
                    © ${new Date().getFullYear()} provento.ai. All rights reserved.
                  </p>

                  <!-- Social Icons -->
                  <div style="margin-bottom:16px;">
                    ${LINKEDIN_ICON}
                  </div>

                  <!-- Help Text -->
                  <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.5;">
                    If you have any questions or concerns, please contact us at
                    <a href="mailto:${(config as any).sesFromEmailId}"
                      style="color:#0ea5e9;text-decoration:none;">
                      support
                    </a>.
                  </p>

                  <!-- Links -->
                  <p style="margin:0;font-size:12px;">
                    <a href="${(config as any).public?.appUrl || '#'}"
                      style="color:#0ea5e9;text-decoration:none;margin:0 8px;">
                      View in Browser
                    </a>
                    |
                    <a href="${(config as any).public?.appUrl}/privacy-policy"
                      style="color:#0ea5e9;text-decoration:none;margin:0 8px;">
                      Privacy Policy
                    </a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export interface EmailRecipient {
  email: string;
  name: string;
}

/**
 * Generate AI Signals (Insights) email HTML body
 */
export function generateInsightsEmailHTML(insightsData: any, period: any): string {
  const summary = insightsData?.analytics_summary || {};
  const insights = insightsData?.insights || {};

  const content = `
    ${sectionBlock("Analytics Summary", `
      <strong>Period:</strong> ${period.start_date || period.startDate || 'N/A'} → ${period.end_date || period.endDate || 'N/A'}<br/>
      <strong>Total Queries:</strong> ${summary.total_queries || 0}<br/>
      <strong>Active Users:</strong> ${summary.active_users || 0}<br/>
      <strong>Unique Artifacts:</strong> ${summary.unique_artifacts || 0}<br/>
      <strong>Total Tokens:</strong> ${summary.total_tokens || 0}
    `)}

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
  `;

  return getEmailLayout(content, {
    subHeader: {
      title: "AI Signals Report",
      bgColor: "#13dcff"
    }
  });
}

/**
 * Generate Knowledge Gap email HTML body
 */
export function generateKnowledgeGapEmailHTML(knowledgeGapData: any, period: any): string {
  const data = knowledgeGapData?.data || knowledgeGapData || {};
  const qualitySummary = data?.quality_summary || {};
  const topUnansweredQuestions = data?.top_unanswered_questions || [];
  const byDepartment = data?.by_department || [];
  const gapAnalysis = data?.gap_analysis || {};

  const content = `
    ${sectionBlock("Coverage Summary", `
      <strong>Period:</strong> ${period.start_date || period.startDate || 'N/A'} → ${period.end_date || period.endDate || 'N/A'}<br/>
      <strong>Total Queries:</strong> ${qualitySummary.total_queries || 0}<br/>
      <strong>Answered:</strong> ${qualitySummary.answered || 0}<br/>
      <strong>Unanswered:</strong> ${qualitySummary.unanswered || 0}<br/>
      <strong>Coverage Rate:</strong> ${qualitySummary.coverage_rate_pct?.toFixed(1) || 0}%<br/>
      <strong>Gap Rate:</strong> ${qualitySummary.gap_rate_pct?.toFixed(1) || 0}%<br/>
      <strong>Trend:</strong> ${qualitySummary.trend_signal || 'N/A'}
    `)}

    <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Top Unanswered Questions</h3>
    ${formatList(topUnansweredQuestions, (item) => `
      <div style="margin-bottom:16px;padding:16px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;">
        <h4 style="color:#b45309;font-weight:600;margin-bottom:8px;">
          ${item.intent}
        </h4>
        <p style="font-size:14px;color:#78350f;margin-bottom:6px;">
          <strong>Frequency:</strong> Queried ${item.combined_frequency} times
        </p>
        <p style="font-size:14px;color:#78350f;">
          <strong>Unique Users:</strong> ${item.unique_askers} employee${item.unique_askers !== 1 ? 's' : ''}
        </p>
        <p style="font-size:13px;color:#78350f;">
          <strong>Last Queried:</strong> ${item.last_asked || 'N/A'}
        </p>
      </div>
    `)}

    <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Coverage by Department</h3>
    ${formatList(byDepartment, (item) => `
      <div style="margin-bottom:16px;padding:16px;background:#f0fdf4;border:1px solid #10b981;border-radius:8px;">
        <h4 style="color:#047857;font-weight:600;margin-bottom:8px;">
          ${item.department}
        </h4>
        <p style="font-size:14px;color:#065f46;margin-bottom:6px;">
          <strong>Coverage Rate:</strong> ${item.coverage_rate_pct?.toFixed(1) || 0}%
        </p>
        <p style="font-size:14px;color:#065f46;">
          <strong>Stats:</strong> ${item.total_queries} total queries | ${item.unanswered} unanswered
        </p>
      </div>
    `)}

    <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Gap Analysis & Recommendations</h3>
    ${formatList(
    (gapAnalysis.gap_clusters || []),
    (cluster) => `
        <div style="margin-bottom:16px;padding:16px;background:#fef08a;border:1px solid #eab308;border-radius:8px;">
          <h4 style="color:#854d0e;font-weight:600;margin-bottom:8px;">
            ${cluster.cluster_title}
          </h4>
          <p style="font-size:14px;color:#713f12;margin-bottom:6px;">
            <strong>Frequency:</strong> Queried ${cluster.total_times_asked} times
          </p>
          <p style="font-size:14px;color:#713f12;margin-bottom:6px;">
            <strong>Employees Affected:</strong> ${cluster.unique_employees_affected} employee${cluster.unique_employees_affected !== 1 ? 's' : ''}
          </p>
          ${cluster.sample_questions?.length ? `
            <div style="background:#fef3c7;padding:8px;border-radius:4px;margin-bottom:8px;">
              <p style="font-size:12px;color:#713f12;font-weight:600;margin-bottom:4px;">Sample Questions:</p>
              <ul style="margin:0;padding-left:20px;font-size:12px;color:#713f12;">
                ${cluster.sample_questions.map(q => `<li>${q}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${cluster.recommended_documents?.length ? `
            <div>
              <p style="font-size:12px;color:#713f12;font-weight:600;margin-bottom:4px;">Recommended Documents:</p>
              ${cluster.recommended_documents.map(doc => `
                <div style="background:#fef3c7;padding:8px;border-radius:4px;margin-bottom:4px;font-size:12px;color:#713f12;">
                  <p style="margin:0 0 4px 0;font-weight:600;">${doc.document_title}</p>
                  <p style="margin:0;">${doc.reason}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `
  )}

    ${gapAnalysis.executive_summary ? `
      <h3 style="font-size:18px;margin:25px 0 10px;color:#333;">Executive Summary</h3>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
          ${gapAnalysis.executive_summary}
        </p>
      </div>
    ` : ''}

    <p style="margin-top:30px;font-size:14px;color:#6b7280;">
      These insights are generated through AI-driven analysis of user query patterns to support proactive knowledge enhancement initiatives.
    </p>
  `;

  return getEmailLayout(content, {
    subHeader: {
      title: "Knowledge Enhancement Opportunities Report",
      bgColor: "#f59e0b"
    }
  });
}

/**
 * Generate Attendance Report email HTML body
 */
export function generateAttendanceReportEmailHTML(attendanceSummary: {
  total_records: number;
  records_by_source: Record<string, number>;
  date_range: { from: string; to: string };
}): string {
  const totalRecords = attendanceSummary.total_records;
  const proventoRecords = attendanceSummary.records_by_source['Provento'] || 0;
  const kekaRecords = attendanceSummary.records_by_source['Keka'] || 0;
  const proventoPct = totalRecords > 0 ? ((proventoRecords / totalRecords) * 100).toFixed(2) : '0';
  const kekaPct = totalRecords > 0 ? ((kekaRecords / totalRecords) * 100).toFixed(2) : '0';

  const content = `
    <p style="font-size:15px;line-height:1.6;color:#374151;margin-bottom:20px;">
      Sharing a quick summary of the Attendance Source Report in Provento.
    </p>

    <h3 style="font-size:18px;margin:25px 0 15px;color:#333;font-weight:600;">📊 Attendance Summary</h3>
    <table width="100%" style="margin-bottom:20px;border-collapse:collapse;">
      <tr style="background:#f3f4f6;border:1px solid #e5e7eb;">
        <td style="padding:12px;font-weight:600;color:#374151;">Total Attendance Records</td>
        <td style="padding:12px;color:#374151;text-align:right;"><strong>${totalRecords}</strong></td>
      </tr>
      <tr style="border:1px solid #e5e7eb;">
        <td style="padding:12px;font-weight:600;color:#374151;">Attendance Marked via Provento</td>
        <td style="padding:12px;color:#374151;text-align:right;"><strong>${proventoRecords}</strong></td>
      </tr>
      <tr style="background:#f3f4f6;border:1px solid #e5e7eb;">
        <td style="padding:12px;font-weight:600;color:#374151;">Attendance Marked via Keka</td>
        <td style="padding:12px;color:#374151;text-align:right;"><strong>${kekaRecords}</strong></td>
      </tr>
      <tr style="border:1px solid #e5e7eb;">
        <td style="padding:12px;font-weight:600;color:#374151;">Provento Percentage</td>
        <td style="padding:12px;color:#374151;text-align:right;"><strong>${proventoPct}%</strong></td>
      </tr>
      <tr style="background:#f3f4f6;border:1px solid #e5e7eb;">
        <td style="padding:12px;font-weight:600;color:#374151;">Keka Percentage</td>
        <td style="padding:12px;color:#374151;text-align:right;"><strong>${kekaPct}%</strong></td>
      </tr>
    </table>

    <p style="font-size:14px;color:#6b7280;margin-bottom:10px;">
      <strong>Date Range:</strong> ${attendanceSummary.date_range.from} to ${attendanceSummary.date_range.to}
    </p>

    <h3 style="font-size:18px;margin:25px 0 15px;color:#333;font-weight:600;">📋 Detailed Report</h3>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin-bottom:20px;">
      Please find the detailed attendance records for all employees in the attached Excel export.
    </p>

    <p style="font-size:15px;line-height:1.6;color:#374151;margin-top:25px;">
      This will help us clearly track adoption of Provento vs direct usage of Keka and gain better visibility into attendance patterns.
    </p>
  `;

  return getEmailLayout(content, {
    subHeader: {
      title: "Summary: Attendance Source Report (Provento vs Keka)",
      bgColor: "#22d3ee"
    }
  });
}
