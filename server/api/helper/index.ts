import { sendEmail } from '../../utils/ses';
import {
  getEmailLayout,
  sectionBlock,
  textBlock,
  linkBlock,
  listBlock,
  CTA_BUTTON,
} from '../../utils/emailTemplates';
import crypto from 'crypto';
import { query } from '../../utils/db';
import { getCompanySizeLabel, getRequestForLabel } from '../../utils/display-mappings';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logError, logWarn } from '../../utils/logger';

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
    logWarn('resolveQrUrl error', { error: err?.message || err });
    return qrUrl || null;
  }
}



function generateRandomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    logError('shouldNotifyChannel error', e)
    return true
  }
}

export const markChannelNotified = async (orgId: string | number, channel: string) => {
  try {
    await query(`INSERT INTO channel_notifications (org_id, channel, last_notified) VALUES ($1, $2, NOW()) ON CONFLICT (org_id, channel) DO UPDATE SET last_notified = NOW()`, [orgId, channel])
  } catch (e) {
    logError('markChannelNotified error', e)
  }
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
    logError('Error generating reset link', err);
    throw err;
  }
};

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

    const htmlBody = getEmailLayout(`
      ${textBlock(`Hi <strong>${name}</strong>,`)}

      ${textBlock(`We're thrilled to have you on board. With provento.ai, you can chat with your artifacts like never before—extracting insights, finding answers, and streamlining workflows effortlessly.`)}

      <h3 style="margin:20px 0 10px;">Here's how to get started:</h3>

      ${sectionBlock(
      '📁 Upload a Artifact:',
      'Log in to your admin portal and drag and drop the artifacts you want your users to interact with.'
    )}

      ${sectionBlock(
      '👥 Onboard WhatsApp Users:',
      `Invite users by entering their WhatsApp number and Email ID.<br/>
        They’ll receive an email with a QR Code to start chatting with artifacts on WhatsApp.`
    )}

      ${sectionBlock(
      '💬 Start Chatting on Slack (New!):',
      `Once you connect your Slack workspace:<br/>
        All users in the workspace will automatically be able to chat with your uploaded artifacts.<br/>
        They simply need to open the bot in Slack and start asking questions.`
    )}

      ${sectionBlock(
      '🏢 Chat on Microsoft Teams:',
      `Once your Teams workspace is connected,<br/>
        All users can instantly start chatting with your uploaded artifacts —<br/>
        just open the bot in Teams and ask questions!`
    )}

      ${textBlock(`Please access our app ${linkBlock('here', portalLink)} with your credentials.`)}

      ${resetPasswordSection}

      ${textBlock(`Let's transform the way you work with artifacts! 🚀`)}
    `);

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
    logError('Error sending signup email', { error: error?.response?.body || error?.message });
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

    const htmlBody = getEmailLayout(`
      ${textBlock(`Hello <strong>${name}</strong>,`)}

      ${textBlock(`We’re pleased to inform you that you have been assigned the <strong>Department Admin</strong> role on <strong>Provento</strong>.`)}

      <h3 style="margin-top:20px;">Your Role & Access</h3>

      ${listBlock([
      'Manage artifacts (artifacts, policies, and knowledge sources) for your department',
      'Assign and unassign users within your department',
      'Oversee and maintain department-specific information and configurations',
    ])}

      <h3 style="margin-top:20px;">Assigned Department</h3>

      ${departments.length
        ? listBlock(departments)
        : textBlock('Department details will be visible after login.')
      }

      ${textBlock(`You can log in to the portal ${linkBlock(portalLink, portalLink)}`)}

      ${resetPasswordSection}

      ${textBlock(`Let's transform the way you work with artifacts! 🚀`)}
    `);

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
    logError('Failed to send department admin welcome mail', err)
    throw err
  }
}


export const sendResetPasswordMail = async (name: string, email: string, resetLink: string) => {
  try {
    const config = useRuntimeConfig();


    const htmlBody = getEmailLayout(`
      ${textBlock(`Hi <strong>${name}</strong>,`)}

      ${textBlock(`We received a request to reset your password. To proceed, please click below:`)}

      ${CTA_BUTTON('Reset Password', resetLink)}

      ${textBlock(`If you did not request this, please ignore this email. Your password will not be changed.`)}
    `);

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


    const htmlBody = getEmailLayout(`
      ${textBlock(`Hi <strong>${name}</strong>,`)}

      ${textBlock(`Your password has been successfully updated. If you did not initiate this change, please contact us immediately.`)}

      ${textBlock(`For your security, we recommend logging in to your account to confirm the changes and update any necessary settings.`)}

      ${textBlock(`If you have any concerns or need assistance, feel free to reach out to us at any time.`)}
    `);

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
      logError('Could not fetch org integrations for email invite', e)
    }

    // Resolve QR url to a public/signed URL if needed
    try {
      orgQr = await resolveQrUrl(orgQr)
    } catch (err) {
      logWarn('Could not resolve QR url for email invite', { error: err?.message || err })
    }

    const whatsapp_enabled = channels.includes('whatsapp')
    const slack_enabled = channels.includes('slack')
    const teams_enabled = channels.includes('teams')

    const htmlBody = getEmailLayout(`
      ${textBlock(`Hi <strong>${name}</strong>,`)}

      ${textBlock(`We are excited to introduce the Artifact Chatting Bot <strong>“provento.ai”</strong>! With this tool, managing and accessing organization artifacts and information has never been easier. You can now chat with your artifacts across multiple platforms.`)}

      <h3 style="margin:20px 0 10px;">Available for you right now:</h3>

      ${whatsapp_enabled ? sectionBlock(
      'WhatsApp Bot',
      'Scan the QR code below to start chatting.'
    ) : ''}

      ${slack_enabled ? sectionBlock(
      'Slack Bot',
      'Add the provento.ai app to your Slack workspace (your admin has already set up the connection).'
    ) : ''}

      ${teams_enabled ? sectionBlock(
      'Microsoft Teams Bot',
      'Add the provento.ai app to your Teams account (your admin has already connected Teams).'
    ) : ''}

      ${(whatsapp_enabled && orgQr)
        ? `
            <table width="100%" style="margin:20px 0;text-align:center;">
              <tr>
                <td>
                  <img src="${orgQr}" style="max-width:240px;border:1px solid #ccc;border-radius:8px"/>
                </td>
              </tr>
            </table>
          `
        : ''
      }

      <h3 style="margin:20px 0 10px;">Steps to Access</h3>

      ${whatsapp_enabled ? sectionBlock(
        'For WhatsApp:',
        `1. Open WhatsApp on your phone.<br/>
        2. Go to Settings → tap the QR code icon next to your name.<br/>
        3. Tap Scan Code and scan the QR code.<br/>
        4. WhatsApp will automatically open the bot conversation.`
      ) : ''}

      ${slack_enabled ? sectionBlock(
        'For Slack:',
        `1. Open Slack.<br/>
        2. Go to Apps → Search for provento.ai.<br/>
        3. Click Add and start chatting.`
      ) : ''}

      ${teams_enabled ? sectionBlock(
        'For Microsoft Teams:',
        `1. Open Teams.<br/>
        2. Go to Apps → Search for provento.ai.<br/>
        3. Add the app and start chatting.`
      ) : ''}

      ${textBlock(`Once you’ve followed the steps above, you’ll be connected to our bot and ready to explore all the features we’ve built just for you!`)}

      <h3 style="margin:20px 0 10px;">Features of provento.ai:</h3>

      ${listBlock([
        'Chat with organization artifacts quickly by asking the bot.',
        'Find quick answers to questions related to your organization artifacts.',
        'This bot will simplify your organization interactions and make artifact chatting seamless.'
      ])}

      ${textBlock(`We’re excited to have you try it out and hope it makes your experience smoother!`)}
    `);

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
      logError('Could not determine org integrations for channel available email', e)
      // fallback to channel param
      if (channel === 'whatsapp') whatsapp_enabled = !!qrCode
      if (channel === 'slack') slack_enabled = true
      if (channel === 'teams') teams_enabled = true
    }

    // Resolve QR url to a public/signed URL if needed
    try {
      orgQr = await resolveQrUrl(orgQr)
    } catch (err) {
      logWarn('Could not resolve QR url for channel available email', { error: err?.message || err })
    }

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

    const htmlBody = getEmailLayout(`
      ${textBlock(`Hi <strong>${name}</strong>, good news — your organization can now use ${channelLabel} with provento.ai.`)}

      ${whatsapp_enabled ? sectionBlock(
      'WhatsApp',
      'Scan the QR code below with WhatsApp to start chatting with the bot instantly.'
    ) : ''}

      ${slack_enabled ? sectionBlock(
      'Slack',
      'Add the provento.ai app to your Slack workspace from the Apps section and start asking questions.'
    ) : ''}

      ${teams_enabled ? sectionBlock(
      'Microsoft Teams',
      'Install the provento.ai app in Teams to chat with your organization artifacts.'
    ) : ''}

      ${(whatsapp_enabled && orgQr)
        ? `
            <table width="100%" style="margin:20px 0;text-align:center;">
              <tr><td><img src="${orgQr}" style="max-width:240px;border:1px solid #ccc;border-radius:8px"/></td></tr>
            </table>
          `
        : ''
      }

      <h3 style="margin:20px 0 10px;">How to get started</h3>

      ${whatsappSteps ? sectionBlock('For WhatsApp:', whatsappSteps) : ''}
      ${slackSteps ? sectionBlock('For Slack:', slackSteps) : ''}
      ${teamsSteps ? sectionBlock('For Microsoft Teams:', teamsSteps) : ''}

      ${textBlock(`If you need any help getting started, reply to this email or contact your admin.`)}
    `);

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

    const htmlBody = getEmailLayout(`
      ${textBlock(headerMessage)}

      <h3 style="margin:20px 0 10px;">Organization Details:</h3>

      <table width="100%" style="font-size:14px;line-height:1.6;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 10px 6px 0;vertical-align:top;">
            <strong>Organization:</strong>
          </td>
          <td style="padding:6px 0;">
            ${orgName}
          </td>
        </tr>

        ${adminName
        ? `
            <tr>
              <td style="padding:6px 10px 6px 0;"><strong>Admin Name:</strong></td>
              <td style="padding:6px 0;">${adminName}</td>
            </tr>
          `
        : ''
      }

        ${adminEmail
        ? `
            <tr>
              <td style="padding:6px 10px 6px 0;"><strong>Admin Email:</strong></td>
              <td style="padding:6px 0;">${adminEmail}</td>
            </tr>
          `
        : ''
      }

        ${adminPhone
        ? `
            <tr>
              <td style="padding:6px 10px 6px 0;"><strong>Admin Phone:</strong></td>
              <td style="padding:6px 0;">${adminPhone}</td>
            </tr>
          `
        : ''
      }
      </table>

      ${textBlock(`Please reach out to the admin to complete account setup and schedule any onboarding sessions if required.`)}
    `);

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

    const htmlBody = getEmailLayout(`
      ${textBlock(`Dear Sales Team,`)}

      ${textBlock(headerMessage)}

      <h3 style="margin:20px 0 10px;">Contact Details:</h3>

      <table style="font-size:14px;line-height:1.6;">
        <tr><td><strong>Full Name:</strong></td><td>${name} ${lastname}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
        ${phone ? `<tr><td><strong>Phone Number:</strong></td><td>${phone}</td></tr>` : ''}
        ${company ? `<tr><td><strong>Company:</strong></td><td>${company}</td></tr>` : ''}
        ${jobTitle ? `<tr><td><strong>Job Title:</strong></td><td>${jobTitle}</td></tr>` : ''}
        ${companySize ? `<tr><td><strong>Company Size:</strong></td><td>${getCompanySizeLabel(companySize)}</td></tr>` : ''}
        ${requestFor ? `<tr><td><strong>Request For:</strong></td><td>${getRequestForLabel(requestFor)}</td></tr>` : ''}
        ${message ? `<tr><td><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
      </table>

      ${textBlock(`Please follow up with this user to schedule the demo session at your earliest convenience.`)}
    `);

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
      const userHtmlBody = getEmailLayout(`
        ${textBlock(`Hi <strong>${name} ${lastname}</strong>,`)}

        ${textBlock(`Thank you for requesting a demo with provento.ai. We have received your request and our sales team will reach out shortly.`)}

        <h3 style="margin:20px 0 10px;">Your submitted details:</h3>

        <table style="font-size:14px;line-height:1.6;">
          <tr><td><strong>Full Name:</strong></td><td>${name} ${lastname}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
          ${phone ? `<tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>` : ''}
          ${company ? `<tr><td><strong>Company:</strong></td><td>${company}</td></tr>` : ''}
          ${jobTitle ? `<tr><td><strong>Job Title:</strong></td><td>${jobTitle}</td></tr>` : ''}
          ${companySize ? `<tr><td><strong>Company Size:</strong></td><td>${getCompanySizeLabel(companySize)}</td></tr>` : ''}
          ${requestFor ? `<tr><td><strong>Request For:</strong></td><td>${getRequestForLabel(requestFor)}</td></tr>` : ''}
          ${message ? `<tr><td><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
        </table>

        ${textBlock(`Once scheduled, we’ll send a calendar invite with meeting details.`)}

        ${textBlock(`If you need immediate assistance, contact us at contact@provento.ai.`)}
      `);

      const userMsg = {
        to: email,
        from: fromEmail2 as string,
        subject: 'Demo Booking Confirmation',
        text: `Thank you for requesting a demo. Our sales team will contact you shortly to confirm date/time and share meeting details.`,
        html: userHtmlBody,
      };

      await sendEmail(userMsg);
    } catch (userMailError) {
      logWarn('Failed to send confirmation email to user', { error: userMailError?.message || userMailError });
      // Do not throw — sales email was already sent and contact saved
    }
  } catch (error: any) {
    console.error('Error sending meeting request email:', error.response?.body || error.message);
    throw new Error(`Failed to send meeting request email: ${error.response?.body?.errors?.[0]?.message || error.message}`);
  }
};


export const sendProviderRequestMail = async ({
  provider_name,
  website_url,
  notes,
  contact_email,
  requested_by,
  organization_name,
}: {
  provider_name: string
  website_url: string
  notes?: string
  contact_email: string
  requested_by?: string
  organization_name?: string
}) => {
  try {
    const config = useRuntimeConfig()

    // ✅ Modules formatting
    // const modulesList =
    //   modules && modules.length
    //     ? `<ul style="padding-left:18px;">
    //           ${modules.map((m) => `<li>${m}</li>`).join('')}
    //         </ul>`
    //     : `<p style="color:#777;">Not specified</p>`

    const htmlBody = getEmailLayout(`
      ${textBlock(`A new application integration request has been submitted.`)}

      <h3 style="margin:20px 0 10px;">Request Details</h3>

      <table style="font-size:14px;line-height:1.6;">
        <tr><td><strong>Organization:</strong></td><td>${organization_name || '-'}</td></tr>
        <tr><td><strong>Requested By:</strong></td><td>${requested_by || '-'}</td></tr>
        <tr><td><strong>Contact Email:</strong></td><td>${contact_email}</td></tr>
      </table>

      <h3 style="margin:20px 0 10px;">Application Details</h3>

      <table style="font-size:14px;line-height:1.6;">
        <tr><td><strong>Application Name:</strong></td><td>${provider_name}</td></tr>
        <tr><td><strong>Website:</strong></td><td>${linkBlock(website_url, website_url)}</td></tr>
      </table>

      ${notes
        ? `<h3 style="margin-top:20px;">Additional Notes</h3>${textBlock(notes)}`
        : ''
      }

      ${textBlock(`Please review and evaluate this provider for integration support.`)}
    `);

    const providerRequestMail = ((config as any).providerRequestMail as string).split(',').map((e: string) => e.trim());

    await sendEmail({
      to: providerRequestMail,
      from: (config as any).sesFromEmailId as string,
      replyTo: contact_email,
      subject: `New Provider Request - ${provider_name}${organization_name ? ` (${organization_name})` : ''
        }`,
      html: htmlBody,
      text: `New provider request from ${organization_name || 'Unknown Org'} - ${provider_name}`,
    })
  } catch (err: any) {
    logError('Failed to send provider request email', err)
    throw err
  }
}
