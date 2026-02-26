import { sendEmail } from '../../utils/ses';
import crypto from 'crypto';
import { query } from '../../utils/db';
import { getCompanySizeLabel, getRequestForLabel } from '../../utils/display-mappings';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function resolveQrUrl(qrUrl?: string | null): Promise<string | null> {
  if (!qrUrl) return null;
  try {
    const config = useRuntimeConfig();
    const parsed = new URL(qrUrl);
    const bucketHost = `${config.awsBucketName}.s3.${config.awsRegion}.amazonaws.com`;
    if (parsed.host === bucketHost) {
      const key = parsed.pathname.slice(1);
      const s3 = new S3Client({
        region: config.awsRegion,
        credentials: {
          accessKeyId: config.awsAccessKeyId,
          secretAccessKey: config.awsSecretAccessKey,
        },
      });
      const signed = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: config.awsBucketName, Key: key }),
        { expiresIn: 86400 }
      );
      return signed;
    }
    return qrUrl;
  } catch (err) {
    console.warn('resolveQrUrl error:', err);
    return qrUrl || null;
  }
}

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

export const sendWelcomeMail = async (name: string, email: string, password: string, portalLink: string, resetLink?: string) => {
  try {
    const config = useRuntimeConfig();


    const resetPasswordSection = resetLink
      ? `
        <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
          You can reset your password by clicking the link below:
        </p>
        <p style="font-size: 16px; line-height: 1.5; margin: 0 0 30px; text-align: center;">
          <a href="${resetLink}" style="color: #13dcff; text-decoration: none; font-weight: bold;">Reset Password</a>
        </p>
      `
      : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to provento.ai</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
          ${EMAIL_HEADER('Welcome to provento.ai! 🎉')}
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 16px; line-height: 1.5; margin: 0 0 10px;">Hi <strong>${name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                We're thrilled to have you on board. With provento.ai, you can chat with your artifacts like never before—extracting insights, finding answers, and streamlining workflows effortlessly.
              </p>
              <h3 style="font-size: 18px; margin: 20px 0 10px;">Here's how to get started:</h3>
              <p style="line-height: 1.5; margin: 0 0 20px;">
                <div style="font-size: 16px;">📁  Upload a Artifact:</div>
                <div style="font-size: 15px;">Log in to your admin portal and drag and drop the artifacts you want your users to interact with.</div>
              </p>
              <p style="line-height: 1.5; margin: 0 0 20px;">
                <div style="font-size: 16px;">👥  Onboard WhatsApp Users:</div>
                <div style="font-size: 15px;">Invite users by entering their WhatsApp number and Email ID.
                <br />
                They’ll receive an email with a QR Code to start chatting with artifacts on WhatsApp.</div>
              </p>
              <p style="line-height: 1.5; margin: 0 0 20px;">
                <div style="font-size: 16px;">💬  Start Chatting on Slack (New!):</div>
                <div style="font-size: 15px;">Once you connect your Slack workspace:
                <br />
                All users in the workspace will automatically be able to chat with your uploaded artifacts.
                <br />
                They simply need to open the bot in Slack and start asking questions.</div>
              </p>
              <p style="line-height: 1.5; margin: 0 0 20px;">
                <div style="font-size: 16px;">🏢  Chat on Microsoft Teams:</div>
                <div style="font-size: 15px;">Once your Teams workspace is connected,
                <br />
                All users can instantly start chatting with your uploaded artifacts —
                just open the bot in Teams and ask questions!</div>
              </p>
              <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                Please access our app <a href="${portalLink}" style="color: #13dcff; text-decoration: none;">here</a> with your credentials.
              </p>
              ${resetPasswordSection}
              <p style="font-size: 16px; line-height: 1.5; margin: 0 0 10px;">Let's transform the way you work with artifacts! 🚀</p>
              <p style="font-size: 16px; line-height: 1.5; margin: 0;">Cheers,</p>
              <p style="font-size: 16px; line-height: 1.5; margin: 0;"><strong>The provento.ai Team</strong></p>
            </td>
          </tr>
          ${EMAIL_FOOTER}
        </table>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: ((config as any).sesFromEmailId) as string,
      subject: 'Welcome to provento.ai',
      text: `Welcome to provento.ai! We're thrilled to have you on board.`,
      html: htmlBody,
    };

    await sendEmail(msg);
    // console.log('Signup email sent successfully');
  } catch (error: any) {
    console.error('Error sending signup email:', error.response?.body || error.message);
    throw new Error(`Failed to send signup email: ${error.response?.body?.errors[0]?.message || error.message}`);
  }
};

export const sendDepartmentAdminWelcomeMail = async (
  name: string,
  email: string,
  portalLink: string,
  departments: string[],
  resetLink?: string
) => {
  try {
    const config = useRuntimeConfig()

    const resetPasswordSection = resetLink
      ? `
        <p style="font-size: 16px; margin: 20px 0 10px;">
          Set your password by clicking the link below:
        </p>
        <p style="text-align: center; margin-bottom: 30px;">
          <a href="${resetLink}"
             style="display:inline-block;padding:10px 18px;
                    background:#13dcff;color:#000;
                    text-decoration:none;font-weight:bold;
                    border-radius:6px;">
            Reset Password
          </a>
        </p>
      `
      : ''

    const departmentList = departments.length
      ? `
        <ul style="font-size: 15px; padding-left: 20px;">
          ${departments.map(d => `<li>${d}</li>`).join('')}
        </ul>
      `
      : `<p style="font-size: 15px;">Department details will be visible after login.</p>`

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f9f9f9;">
        <table align="center" width="600"
               style="background:#ffffff;border-radius:10px;
                      margin:20px auto;padding:20px;">
          ${EMAIL_HEADER('Department Admin Role Assigned – Provento')}
          <tr>
            <td style="padding:10px 20px;">
              <p style="font-size:16px;">Hello <strong>${name}</strong>,</p>

              <p style="font-size:16px;">
                We’re pleased to inform you that you have been assigned the
                <strong>Department Admin</strong> role on <strong>Provento</strong>.
              </p>

              <h3 style="margin-top:20px;">Your Role & Access</h3>
              <p style="font-size:15px;">As a Department Admin, you now have access to:</p>

              <ul style="font-size:15px; line-height:1.6;">
                <li>Manage artifacts (artifacts, policies, and knowledge sources) for your department</li>
                <li>Assign and unassign users within your department</li>
                <li>Oversee and maintain department-specific information and configurations</li>
              </ul>

              <h3 style="margin-top:20px;">Assigned Department</h3>
              <p style="font-size:15px;">You have been assigned as the Department Admin for:</p>
              ${departmentList}

              <p style="font-size:16px; margin-top:20px;">
                You can log in to the portal here:
                <a href="${portalLink}" style="color:#13dcff;text-decoration:none;">
                  ${portalLink}
                </a>
              </p>

              ${resetPasswordSection}

              <p style="font-size:16px; margin-top:20px;">
                Let's transform the way you work with artifacts! 🚀
              </p>

              <p style="margin-top:20px;">
                Cheers,<br />
                <strong>The provento.ai Team</strong>
              </p>
            </td>
          </tr>
          ${EMAIL_FOOTER}
        </table>
      </body>
      </html>
    `

    await sendEmail({
      to: email,
      from: (config as any).sesFromEmailId,
      subject: 'Department Admin Role Assigned – Provento',
      html: htmlBody,
      text: `Hello ${name},

        You have been assigned the Department Admin role on Provento.

        Log in here: ${portalLink}

        Set your password using this link:
        ${resetLink || ''}

        – The provento.ai Team`,
    })
  } catch (err: any) {
    console.error('Failed to send department admin welcome mail:', err)
    throw err
  }
}


export const sendResetPasswordMail = async (name: string, email: string, resetLink: string) => {
  try {
    const config = useRuntimeConfig();


    const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
        ${EMAIL_HEADER('Password Reset Request')}
        <tr>
          <td style="padding: 20px;">
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 10px;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              We received a request to reset your password. To proceed, please click the link below:
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              <a href="${resetLink}" style="color: #13dcff; text-decoration: none; font-weight: bold;">Reset Password</a>
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              If you did not request this, please ignore this email. Your password will not be changed.
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0;">Cheers,</p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0;"><strong>The provento.ai Team</strong></p>
          </td>
        </tr>
        ${EMAIL_FOOTER}
      </table>
    </body>
    </html>
  `;

    const msg = {
      to: email,
      from: ((config as any).sesFromEmailId) as string,
      subject: 'Password Reset Request',
      text: `We received a request to reset your password. If you did not request this, please ignore this email.`,
      html: htmlBody,
    };

    await sendEmail(msg);
  } catch (error: any) {
    throw new Error(`Failed to send reset password email: ${error.response?.body?.errors[0]?.message || error.message}`);
  }
};

export const sendPasswordUpdatedMail = async (name: string, email: string) => {
  try {
    const config = useRuntimeConfig();


    const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Successfully Updated</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
        ${EMAIL_HEADER('Your Password Has Been Updated')}
        <tr>
          <td style="padding: 20px;">
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 10px;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              Your password has been successfully updated. If you did not initiate this change, please contact us immediately.
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
              For your security, we recommend logging in to your account to confirm the changes and update any necessary settings.
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 10px;">
              If you have any concerns or need assistance, feel free to reach out to us at any time.
            </p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 10px;">Cheers,</p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0;"><strong>The provento.ai Team</strong></p>
          </td>
        </tr>
        ${EMAIL_FOOTER}
      </table>
    </body>
    </html>
  `;

    const msg = {
      to: email,
      from: ((config as any).sesFromEmailId) as string,
      subject: 'Your Password Has Been Updated',
      text: `Your password has been successfully updated. If you did not initiate this change, please contact us immediately.`,
      html: htmlBody,
    };

    await sendEmail(msg);
  } catch (error: any) {
    throw new Error(`Failed to send password updated email: ${error.response?.body?.errors[0]?.message || error.message}`);
  }
};

function generateRandomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const sendUserAdditionMail = async (name: string, email: string, qrCode: string, orgIdParam?: string | number) => {
  try {
    const randomStr = generateRandomString();
    const config = useRuntimeConfig();


    // Determine if other channels are enabled for this user's org (prefer orgIdParam if provided)
    let channels: string[] = []
    let orgQr: string | null = qrCode || null
    try {
      let orgId: any = orgIdParam
      if (!orgId) {
        const userRes = await query(`SELECT org_id FROM users WHERE LOWER(email) = $1 LIMIT 1`, [String(email).toLowerCase()])
        if (userRes.rows.length) orgId = userRes.rows[0].org_id
      }

      if (orgId) {
        const integ = await query(
          `SELECT o.qr_code, COALESCE(w.whatsapp_status, false) AS whatsapp_status, COALESCE(s.status, 'inactive') AS slack_status, COALESCE(t.status, 'inactive') AS teams_status
           FROM organizations o
           LEFT JOIN meta_app_details w ON o.org_id = w.org_id
           LEFT JOIN slack_team_mappings s ON o.org_id = s.org_id
           LEFT JOIN teams_tenant_mappings t ON o.org_id = t.org_id
           WHERE o.org_id = $1 LIMIT 1`,
          [orgId]
        )
        const row = integ.rows[0] || {}
        if (row.whatsapp_status) channels.push('whatsapp')
        if (row.slack_status === 'active' || row.slack_status === 'connected') channels.push('slack')
        if (row.teams_status === 'active' || row.teams_status === 'connected') channels.push('teams')
        orgQr = row.qr_code || orgQr
      }
    } catch (e) {
      console.error('Could not fetch org integrations for email invite:', e)
    }

    // Resolve QR url to a public/signed URL if needed
    try {
      orgQr = await resolveQrUrl(orgQr)
    } catch (err) {
      console.warn('Could not resolve QR url for email invite:', err)
    }

    const whatsapp_enabled = channels.includes('whatsapp')
    const slack_enabled = channels.includes('slack')
    const teams_enabled = channels.includes('teams')

    const whatsappBlock = whatsapp_enabled
      ? `\n          <h4 style="margin-bottom:6px">WhatsApp Bot �� Scan the QR code below to start chatting.</h4>\n        `
      : ''

    const slackBlock = slack_enabled
      ? `\n          <h4 style="margin-bottom:6px">Slack Bot – Add the provento.ai app to your Slack workspace (your admin has already set up the connection).</h4>\n        `
      : ''

    const teamsBlock = teams_enabled
      ? `\n          <h4 style="margin-bottom:6px">Microsoft Teams Bot – Add the provento.ai app to your Teams account (your admin has already connected Teams).</h4>\n        `
      : ''

    const qrHtml = (whatsapp_enabled && orgQr) ? `\n      <div style="text-align:center;margin:16px 0">\n        <img src="${orgQr}" alt="WhatsApp QR Code" style="max-width:240px;border:1px solid #ccc;border-radius:8px"/>\n      </div>\n    ` : ''

    const whatsappSteps = whatsapp_enabled
      ? `\n        <h5>For WhatsApp:</h5>\n        <ol>\n          <li>Open WhatsApp on your phone.</li>\n          <li>Go to Settings → tap the QR code icon next to your name.</li>\n          <li>Tap Scan Code and scan the QR code below.</li>\n          <li>WhatsApp will automatically open the bot conversation.</li>\n        </ol>\n      `
      : ''

    const slackSteps = slack_enabled
      ? `\n        <h5>For Slack:</h5>\n        <ol>\n          <li>Open Slack.</li>\n          <li>Go to Apps → Search for provento.ai.</li>\n          <li>Click Add and start chatting with your artifacts.</li>\n        </ol>\n      `
      : ''

    const teamsSteps = teams_enabled
      ? `\n        <h5>For Microsoft Teams:</h5>\n        <ol>\n          <li>Open Teams.</li>\n          <li>Go to Apps → Search for provento.ai.</li>\n          <li>Add the app to your Teams account and start chatting.</li>\n        </ol>\n      `
      : ''

    const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to Access provento.ai</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background-color: #13dcff;
          color: #ffffff;
          padding: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 20px;
        }
        .content p {
          margin: 10px 0;
          font-size: 16px;
          line-height: 1.5;
        }
        .qr-code {
          text-align: center;
          margin: 20px 0;
        }
        .qr-code img {
          max-width: 200px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        .steps {
          margin: 20px 0;
          padding-left: 20px;
        }
        .steps li {
          margin: 10px 0;
        }
        .footer {
          background-color: #f1f1f1;
          color: #777;
          text-align: center;
          padding: 10px 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${EMAIL_HEADER('Invitation to Access provento.ai')}
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>We are excited to introduce the Artifact Chatting Bot <strong>“provento.ai”</strong>! With this tool, managing and accessing organization artifacts and information has never been easier. You can now chat with your artifacts across multiple platforms.</p>

          <h3>Available for you right now:</h3>

          ${whatsappBlock}
          ${slackBlock}
          ${teamsBlock}

          ${qrHtml}

          <h3>Steps to Access</h3>

          ${whatsappSteps}
          ${slackSteps}
          ${teamsSteps}

          <p>Once you’ve followed the steps above, you’ll be connected to our bot and ready to explore all the features we’ve built just for you!</p>
          <h3>Features of provento.ai:</h3>
          <ul class="steps">
            <li>Chat with organization artifacts quickly by asking the bot.</li>
            <li>Find quick answers to questions related to your organization artifacts.</li>
            <li>This bot will simplify your organization interactions and make artifact chatting seamless.</li>
          </ul>
          <p>We’re excited to have you try it out and hope it makes your experience smoother!</p>
          <p>Best regards,</p>
          <p><strong>The provento.ai Team</strong></p>
        </div>
        ${EMAIL_FOOTER}
      </div>
    </body>
    </html>
    `;

    const msg = {
      to: email,
      from: ((config as any).sesFromEmailId) as string,
      subject: 'Invitation to Access provento.ai',
      text: `Invitation to Access provento.ai! We're thrilled to have you on board.`,
      html: htmlBody,
    };

    await sendEmail(msg);
    // console.log('User addition email sent successfully');
  } catch (error: any) {
    console.error('Error sending User addition email:', error.response?.body || error.message);
    throw new Error(
      `Failed to send User addition email: ${error.response?.body?.errors?.[0]?.message || error.message}`
    );
  }
};

// Notify users about newly available channel (Slack/Teams) with a simple email
export const sendChannelAvailableMail = async (name: string, email: string, channel: 'whatsapp' | 'slack' | 'teams', qrCode?: string, orgIdParam?: string | number) => {
  try {
    const config = useRuntimeConfig();


    // Determine available channels for the user's org (prefer orgIdParam if provided)
    let whatsapp_enabled = false
    let slack_enabled = false
    let teams_enabled = false
    let orgQr: string | null = qrCode || null

    try {
      let orgId: any = orgIdParam
      if (!orgId) {
        const userRes = await query(`SELECT org_id FROM users WHERE LOWER(email) = $1 LIMIT 1`, [String(email).toLowerCase()])
        if (userRes.rows.length) orgId = userRes.rows[0].org_id
      }

      if (orgId) {
        const integ = await query(
          `SELECT o.qr_code, COALESCE(w.whatsapp_status, false) AS whatsapp_status, COALESCE(s.status, 'inactive') AS slack_status, COALESCE(t.status, 'inactive') AS teams_status
           FROM organizations o
           LEFT JOIN meta_app_details w ON o.org_id = w.org_id
           LEFT JOIN slack_team_mappings s ON o.org_id = s.org_id
           LEFT JOIN teams_tenant_mappings t ON o.org_id = t.org_id
           WHERE o.org_id = $1 LIMIT 1`,
          [orgId]
        )
        const row = integ.rows[0] || {}
        whatsapp_enabled = !!row.whatsapp_status
        slack_enabled = (row.slack_status === 'active' || row.slack_status === 'connected')
        teams_enabled = (row.teams_status === 'active' || row.teams_status === 'connected')
        orgQr = row.qr_code || orgQr
      } else {
        // If orgId still not determined, fall back to channel param for single-channel notifications
        if (channel === 'whatsapp') whatsapp_enabled = !!qrCode
        if (channel === 'slack') slack_enabled = true
        if (channel === 'teams') teams_enabled = true
      }
    } catch (e) {
      console.error('Could not determine org integrations for channel available email:', e)
      // fallback to channel param
      if (channel === 'whatsapp') whatsapp_enabled = !!qrCode
      if (channel === 'slack') slack_enabled = true
      if (channel === 'teams') teams_enabled = true
    }

    // Resolve QR url to a public/signed URL if needed
    try {
      orgQr = await resolveQrUrl(orgQr)
    } catch (err) {
      console.warn('Could not resolve QR url for channel available email:', err)
    }

    // Build HTML according to requested template
    const whatsappSection = whatsapp_enabled
      ? `
        <h4>WhatsApp Bot – Scan the QR code below to start chatting.</h4>
      `
      : ''

    const slackSection = slack_enabled
      ? `
        <h4>Slack Bot – Add the provento.ai app to your Slack workspace (your admin has already set up the connection).</h4>
      `
      : ''

    const teamsSection = teams_enabled
      ? `
        <h4>Microsoft Teams Bot – Add the provento.ai app to your Teams account (your admin has already connected Teams).</h4>
      `
      : ''

    const qrHtml = (whatsapp_enabled && orgQr) ? `<div style="text-align:center;margin:16px 0"><img src="${orgQr}" alt="WhatsApp QR Code" style="max-width:240px;border:1px solid #ccc;border-radius:8px"/></div>` : ''

    const whatsappSteps = whatsapp_enabled
      ? `
        <h5 style="margin-bottom:6px">For WhatsApp:</h5>
        <ol style="margin-top:6px;margin-bottom:12px;padding-left:20px;color:#374151">
          <li>Open WhatsApp on your phone.</li>
          <li>Go to Settings → tap the QR code icon next to your name.</li>
          <li>Tap Scan Code and scan the QR code below.</li>
          <li>WhatsApp will automatically open the bot conversation.</li>
        </ol>
        <p style="margin:8px 0"><strong>QR Code:</strong></p>
        ${qrHtml}
      `
      : ''

    const slackSteps = slack_enabled
      ? `
        <h5 style="margin-bottom:6px">For Slack:</h5>
        <ol style="margin-top:6px;margin-bottom:12px;padding-left:20px;color:#374151">
          <li>Open Slack.</li>
          <li>Go to Apps → Search for provento.ai.</li>
          <li>Click Add and start chatting with your artifacts.</li>
        </ol>
      `
      : ''

    const teamsSteps = teams_enabled
      ? `
        <h5 style="margin-bottom:6px">For Microsoft Teams:</h5>
        <ol style="margin-top:6px;margin-bottom:12px;padding-left:20px;color:#374151">
          <li>Open Teams.</li>
          <li>Go to Apps → Search for provento.ai.</li>
          <li>Add the app to your Teams account and start chatting.</li>
        </ol>
      `
      : ''

    const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'slack' ? 'Slack' : 'Microsoft Teams'

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${channelLabel} is available — provento.ai</title>
      </head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;color:#333;background:#f4f6f8;">
        <div style="max-width:680px;margin:24px auto;background:#ffffff;padding:28px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.06);">
          ${EMAIL_HEADER(channelLabel + ' is now available')}
          <div style="text-align:center;margin-top:8px;margin-bottom:8px"><p style="color:#6b7280;margin:0">Hi <strong>${name}</strong>, good news — your organization can now use ${channelLabel} with provento.ai.</p></div>

          <div style="margin-top:18px">
            ${whatsapp_enabled ? `<div style="margin-bottom:14px;padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #e6eef5"><strong>WhatsApp</strong><p style="margin:6px 0 0;color:#374151">Scan the QR code below with WhatsApp to start chatting with the bot instantly.</p></div>` : ''}
            ${slack_enabled ? `<div style="margin-bottom:14px;padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #e6eef5"><strong>Slack</strong><p style="margin:6px 0 0;color:#374151">Add the provento.ai app to your Slack workspace from the Apps section and start asking questions from your artifacts.</p></div>` : ''}
            ${teams_enabled ? `<div style="margin-bottom:14px;padding:12px;border-radius:8px;background:#f8fafc;border:1px solid #e6eef5"><strong>Microsoft Teams</strong><p style="margin:6px 0 0;color:#374151">Install the provento.ai app in Teams to chat with your organization artifacts right from Teams.</p></div>` : ''}
          </div>

          <div style="margin-top:18px">
            <h3 style="margin:0 0 10px 0;color:#0b7fa7">How to get started</h3>
            ${whatsappSteps}
            ${slackSteps}
            ${teamsSteps}
          </div>

          <hr style="border:none;border-top:1px solid #eef2f7;margin:20px 0"/>

          <p style="color:#6b7280;font-size:13px">If you need any help getting started, reply to this email or contact your admin.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:6px">Best regards,<br/>The provento.ai Team</p>
        </div>

        <div style="max-width:680px;margin:8px auto;text-align:center;color:#9aa4ae;font-size:12px">
          <p style="margin:8px 0">© 2025 provento.ai. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: ((config as any).sesFromEmailId) as string,
      subject: `${channelLabel} is now available on provento.ai`,
      text: `${channelLabel} is now available for your organization on provento.ai. Log in to start using it: ${config.public.appUrl}`,
      html: htmlBody,
    };

    await sendEmail(msg);
  } catch (error: any) {
    console.error('Error sending channel available email:', error.response?.body || error.message);
    // don't throw to avoid failing main transaction
  }
};


// Persistent suppression helpers: store last notification time per org+channel
export const shouldNotifyChannel = async (orgId: string | number, channel: string, windowHours: number = 24) => {
  try {
    const res = await query(`SELECT last_notified FROM channel_notifications WHERE org_id = $1 AND channel = $2`, [orgId, channel])
    if (!res.rows.length) return true
    const last = res.rows[0].last_notified
    if (!last) return true
    const diffMs = new Date().getTime() - new Date(last).getTime()
    return diffMs > windowHours * 3600 * 1000
  } catch (e) {
    console.error('shouldNotifyChannel error', e)
    return true
  }
}

export const markChannelNotified = async (orgId: string | number, channel: string) => {
  try {
    await query(`INSERT INTO channel_notifications (org_id, channel, last_notified) VALUES ($1, $2, NOW()) ON CONFLICT (org_id, channel) DO UPDATE SET last_notified = NOW()`, [orgId, channel])
  } catch (e) {
    console.error('markChannelNotified error', e)
  }
}

export const sendOrganizationOnboardedMail = async ({
  orgName,
  adminName,
  adminEmail,
  adminPhone,
  domain,
}: {
  orgName: string
  adminName?: string
  adminEmail?: string
  adminPhone?: string
  domain?: string
}) => {
  try {
    const config = useRuntimeConfig();
    const fromEmail = (config as any).sesFromEmailId;
    const salesTeamList = (config as any).salesTeamEmails;
    if (!fromEmail || !salesTeamList) {
      console.warn('Email configuration missing. Organization onboarded but notification not sent:', { orgName, adminEmail });
      return;
    }

    const headerMessage = domain === 'Prod'
      ? 'A new organization has been onboarded.'
      : `A new organization has been onboarded via ${domain || 'unknown'} environment.`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>New Organization Onboarded</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin: 20px auto; border-radius: 10px;">
          ${EMAIL_HEADER('New Organization Onboarded')}
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 16px; line-height: 1.5;">${headerMessage}</p>

              <h3 style="font-size: 18px; margin-top: 20px;">Organization Details:</h3>
              <table width="100%" style="font-size: 15px; margin: 15px 0; border-collapse: collapse;">
                <tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Organization:</strong></td><td style="padding: 5px 0;">${orgName}</td></tr>
                ${adminName ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Admin Name:</strong></td><td style="padding: 5px 0;">${adminName}</td></tr>` : ''}
                ${adminEmail ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Admin Email:</strong></td><td style="padding: 5px 0;">${adminEmail}</td></tr>` : ''}
                ${adminPhone ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Admin Phone:</strong></td><td style="padding: 5px 0;">${adminPhone}</td></tr>` : ''}
              </table>

              <p style="font-size: 16px; line-height: 1.5;">Please reach out to the admin to complete account setup and schedule any onboarding sessions if required.</p>

              <p style="font-size: 16px; line-height: 1.5;">Thanks & Regards,<br><strong>provento.ai Team</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 10px 20px; background-color: #f1f1f1; border-radius: 0 0 10px 10px;">
              <p style="font-size: 14px; color: #777; margin: 0;">© 2025 provento.ai. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const salesTeamEmails = (salesTeamList as string).split(',').map((e: string) => e.trim());

    const msg = {
      to: salesTeamEmails,
      from: fromEmail as string,
      subject: `New Organization Onboarded - ${orgName}`,
      text: `A new organization (${orgName}) was onboarded${adminEmail ? ` by ${adminEmail}` : ''}.`,
      html: htmlBody,
    };

    await sendEmail(msg);
  } catch (error: any) {
    console.error('Error sending organization onboarded email:', error.response?.body || error.message);
    throw new Error(`Failed to send organization onboarded email: ${error.response?.body?.errors?.[0]?.message || error.message}`);
  }
};

export const sendMeetingRequestMail = async ({
  name,
  lastname,
  email,
  phone,
  requestFor,
  message,
  company,
  jobTitle,
  companySize,
  domain
}: {
  name: string
  lastname: string
  email: string
  phone: string
  requestFor: string
  message: string
  company: string
  jobTitle: string
  companySize: string
  domain: string
}) => {
  try {
    const config = useRuntimeConfig();

    // Check if email configuration is available
    const fromEmail2 = (config as any).sesFromEmailId;
    const salesTeamList2 = (config as any).salesTeamEmails;
    if (!fromEmail2 || !salesTeamList2) {
      console.warn('Email configuration missing. Contact form data received but email not sent:', {
        name, lastname, email, company, requestFor
      });
      return; // Exit gracefully without sending email
    }

    const headerMessage = domain === 'Prod'
      ? 'We have received a new <strong>Demo Request</strong> via the website.'
      : `We have received a new <strong>Demo Request</strong> request via the <strong>${domain}</strong> website.`;

    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Book Meeting Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin: 20px auto; border-radius: 10px; box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);">
          ${EMAIL_HEADER('Demo Request')}
          <tr>
            <td style="padding: 20px;">
              <p style="font-size: 16px; line-height: 1.5;">Dear Sales Team,</p>
              <p style="font-size: 16px; line-height: 1.5;">
                ${headerMessage}
              </p>

              <h3 style="font-size: 18px; margin-top: 20px;">Contact Details:</h3>
              <table width="100%" style="font-size: 15px; margin: 15px 0; border-collapse: collapse;">
                <tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Full Name:</strong></td><td style="padding: 5px 0;">${name} ${lastname}</td></tr>
                <tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Email:</strong></td><td style="padding: 5px 0;">${email}</td></tr>
                ${phone ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Phone Number:</strong></td><td style="padding: 5px 0;">${phone}</td></tr>` : ''}
                ${company ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Company:</strong></td><td style="padding: 5px 0;">${company}</td></tr>` : ''}
                ${jobTitle ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Job Title:</strong></td><td style="padding: 5px 0;">${jobTitle}</td></tr>` : ''}
                ${companySize ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Company Size:</strong></td><td style="padding: 5px 0;">${getCompanySizeLabel(companySize)}</td></tr>` : ''}
                ${requestFor ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Request For:</strong></td><td style="padding: 5px 0;">${getRequestForLabel(requestFor)}</td></tr>` : ''}
                ${message ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Message:</strong></td><td style="padding: 5px 0;">${message}</td></tr>` : ''}
              </table>

              <p style="font-size: 16px; line-height: 1.5;">
                Please follow up with this user to schedule the demo session at your earliest convenience.
              </p>

              <p style="font-size: 16px; line-height: 1.5;">Thanks & Regards,<br><strong>provento.ai Team</strong></p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 10px 20px; background-color: #f1f1f1; border-radius: 0 0 10px 10px;">
              <p style="font-size: 14px; color: #777; margin: 0;">© 2025 provento.ai. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const salesTeamEmails = (salesTeamList2 as string).split(',').map(email => email.trim());

    const msg = {
      to: salesTeamEmails,
      from: fromEmail2 as string,
      subject: `Demo Request - ${name} ${lastname}${company ? ` from ${company}` : ''}`,
      text: `New demo request from ${name} ${lastname}${company ? ` (${company})` : ''} regarding ${requestFor || 'general inquiry'}. Email: ${email}${phone ? `, Phone: ${phone}` : ''}`,
      html: htmlBody,
    };

    await sendEmail(msg);
    // console.log('Book meeting request email sent successfully');

    // Send confirmation email to the user who submitted the demo request
    try {
      const userHtmlBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Demo Booking Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9; color: #333;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; margin: 20px auto; border-radius: 10px;">
            ${EMAIL_HEADER('Demo Booking Confirmation')}
            <tr>
              <td style="padding: 20px;">
                <p style="font-size: 16px; line-height: 1.5;">Hi <strong>${name} ${lastname}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.5;">Thank you for requesting a demo with provento.ai. We have received your request and our sales team will reach out to you shortly to confirm the demo time and share meeting details.</p>

                <h3 style="font-size: 18px; margin-top: 20px;">Your submitted details:</h3>
                <table width="100%" style="font-size: 15px; margin: 15px 0; border-collapse: collapse;">
                  <tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Full Name:</strong></td><td style="padding: 5px 0;">${name} ${lastname}</td></tr>
                  <tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Email:</strong></td><td style="padding: 5px 0;">${email}</td></tr>
                  ${phone ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Phone Number:</strong></td><td style="padding: 5px 0;">${phone}</td></tr>` : ''}
                  ${company ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Company:</strong></td><td style="padding: 5px 0;">${company}</td></tr>` : ''}
                  ${jobTitle ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Job Title:</strong></td><td style="padding: 5px 0;">${jobTitle}</td></tr>` : ''}
                  ${companySize ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Company Size:</strong></td><td style="padding: 5px 0;">${getCompanySizeLabel(companySize)}</td></tr>` : ''}
                  ${requestFor ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Request For:</strong></td><td style="padding: 5px 0;">${getRequestForLabel(requestFor)}</td></tr>` : ''}
                  ${message ? `<tr><td style="padding: 5px 10px 5px 0; vertical-align: top;"><strong>Message:</strong></td><td style="padding: 5px 0;">${message}</td></tr>` : ''}
                </table>

                <p style="font-size: 16px; line-height: 1.5;">Once the demo is scheduled we'll send a calendar invite containing the confirmed date/time, timezone and the meeting link (Zoom/Google Meet). If you have a preferred time or timezone, please reply to this email after you receive a message from our sales team.</p>

                <p style="font-size: 16px; line-height: 1.5;">If you need immediate assistance, contact us at <a href="mailto:contact@provento.ai">contact@provento.ai</a>.</p>

                <p style="font-size: 16px; line-height: 1.5;">Thanks & Regards,<br><strong>provento.ai Team</strong></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 10px 20px; background-color: #f1f1f1; border-radius: 0 0 10px 10px;">
                <p style="font-size: 14px; color: #777; margin: 0;">© 2025 provento.ai. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const userMsg = {
        to: email,
        from: fromEmail2 as string,
        subject: 'Demo Booking Confirmation',
        text: `Thank you for requesting a demo. Our sales team will contact you shortly to confirm date/time and share meeting details.`,
        html: userHtmlBody,
      };

      await sendEmail(userMsg);
    } catch (userMailError) {
      console.warn('Failed to send confirmation email to user:', userMailError);
      // Do not throw — sales email was already sent and contact saved
    }
  } catch (error: any) {
    console.error('Error sending meeting request email:', error.response?.body || error.message);
    throw new Error(`Failed to send meeting request email: ${error.response?.body?.errors?.[0]?.message || error.message}`);
  }
};


export function generateRandomPassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const passwordLength = Math.floor(Math.random() * 3) + 6; // Generate a length between 6 and 8
  let password = '';
  for (let i = 0; i < passwordLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
}

export const generateResetLink = async (
  email: string,
  appUrl: string,
  userId: string
): Promise<{ resetLink: string }> => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Build query conditionally based on whether userId is provided
    let userCheck;
    if (userId) {
      userCheck = await query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id = $2',
        [email, userId]
      );
    } else {
      userCheck = await query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );
    }

    if (!userCheck.rows.length) {
      throw new Error(`No user found with email: ${email}`);
    }

    const result = await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3 AND user_id = $4 RETURNING user_id;',
      [token, expiry, email, userCheck.rows[0].user_id]
    );

    if (!result.rows.length) {
      throw new Error('Failed to update reset token.');
    }

    const resetLink = `${appUrl}/update-password?token=${encodeURIComponent(token)}`;
    return { resetLink };
  } catch (err) {
    console.error('Error generating reset link:', err);
    throw err;
  }
};
