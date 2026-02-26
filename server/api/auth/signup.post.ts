import bcrypt from 'bcrypt';
import { defineEventHandler, readBody, setResponseStatus } from 'h3';

import { CustomError } from '../../utils/custom.error';
import { getPasswordRegex, SignupValidation } from '../../utils/validations';
import { isPersonalEmail, personalEmailDomains } from '../../utils/auth-utils';
import { query } from '../../utils/db';
import { sendWelcomeMail, sendOrganizationOnboardedMail } from '../helper';
import { getCookie, setCookie } from 'h3'

const isValidPhoneNumber = (wpNumber: string): boolean => {
  const phoneRegex = /^\+(\d{1,3})\d{10,14}$/;
  return phoneRegex.test(wpNumber);
};

async function getAwsMarketplaceSession(event) {
  const sessionToken = getCookie(event, 'aws_marketplace_session')
  if (!sessionToken) return null

  const res = await query(
    `
    SELECT customer_id
    FROM aws_marketplace_sessions
    WHERE session_token = $1
      AND consumed = false
      AND expires_at > now()
    `,
    [sessionToken]
  )

  return res.rows[0] || null
}

export default defineEventHandler(async (event) => {
  const params = await readBody(event);
  const config = useRuntimeConfig();

  try {
    if (!params.name) throw new CustomError('Please enter your name', 400);
    if (!params.email) throw new CustomError('Please enter your email address', 400);
    if (!params.wpNumber) throw new CustomError('Please enter your WhatsApp number', 400);
    if (!params.password) throw new CustomError('Please enter your password', 400);
    if (!params.companyName) throw new CustomError('Please enter your company name', 400);

    if (isPersonalEmail(params.email, personalEmailDomains)) {
      throw new CustomError('Signup is not allowed with personal email addresses.', 400);
    }

    if (!getPasswordRegex().test(params.password)) {
      throw new CustomError(
        'Password must contain at least one uppercase, lowercase, special character, and digit with a minimum of 8 characters. The characters ", \', <, >, `, \\ are prohibited.',
        400
      );
    }

    const validation = SignupValidation.safeParse(params);
    if (!validation.success) {
      throw new CustomError('Validation error: ' + validation.error.errors[0].message, 400);
    }

    if (params.name.length < 3) throw new CustomError('Name must be at least 3 characters long', 400);
    if (params.companyName.length < 3) throw new CustomError('Company name must be at least 3 characters long', 400);

    params.companyName = params.companyName.trim();

    const existingCompany = await query('SELECT * FROM organizations WHERE org_name = $1', [params.companyName]);
    let orgId: string;
    const isNewCompany = !existingCompany?.rows?.length;

    // Check for duplicate org_tax_id if provided
    if (params.taxId) {
      const existingTaxId = await query(
        'SELECT org_id FROM organizations WHERE org_tax_id = $1',
        [params.taxId]
      );
      if (existingTaxId?.rows?.length) {
        throw new CustomError('This organization already exists in the system. Please contact admin for access.', 409);
      }
    }

    const existingUserByEmail = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [params.email]);
    if (existingUserByEmail?.rows?.length) {
      throw new CustomError('User is already registered with this email', 409);
    }

    if (!params.wpNumber.startsWith('+') || !isValidPhoneNumber(params.wpNumber)) {
      throw new CustomError('WhatsApp number must include a valid country code and be correctly formatted.', 400);
    }

    const existingUserByPhone = await query('SELECT * FROM users WHERE contact_number = $1', [params.wpNumber]);
    if (existingUserByPhone?.rows?.length) {
      throw new CustomError('This WhatsApp number is already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(params.password, 10);
    const roleId = isNewCompany ? '1' : '2';
    const appLink = `${config.public.appUrl}/login`;
    const awsSession = await getAwsMarketplaceSession(event)
    const awsCustomerId = awsSession?.customer_id || null

    if (getCookie(event, 'aws_marketplace_session') && !awsCustomerId) {
      throw new CustomError('AWS Marketplace session expired. Please return to AWS Marketplace and try again.', 401);
    }

    // let processFulfillmentData = null;

    // if (params.registrationToken) {
    //   processFulfillmentData = await processFulfillment(params.registrationToken)
    // }

    if (isNewCompany) {
      const newOrg = await query(
        'INSERT INTO organizations (org_name, org_country, org_tax_id, source) VALUES ($1, $2, $3, $4) RETURNING org_id',
        [params.companyName, params.country || 'usa', params.taxId || null, awsCustomerId ? 'aws' : 'website']
      );
      orgId = newOrg.rows[0].org_id;
    } else {
      throw new CustomError('Company is already registered, please contact admin', 409);
    }

    if (awsCustomerId) {
      const customerId = awsCustomerId
      const res = await query(
        `
          UPDATE public.aws_marketplace_subscriptions
          SET org_id = $1, active = TRUE,
              updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = $2
          RETURNING id;
        `,
        [orgId, customerId]
      )

      if (res.rowCount === 0) {
        console.warn(`⚠️ No AWS subscription found for customer_id ${customerId}`)
      }

      // Process entitlement
      // const entitlement = await query(
      //   `SELECT * FROM aws_marketplace_entitlements WHERE customer_id = $1`,
      //   [customerId]
      // );

      // if (!entitlement?.rows?.length) {
      //   throw new CustomError('Entitlement record not found for this customer', 404);
      // }

      // const entitlementRow = entitlement.rows[0];
      // let dimension = entitlementRow.dimension;
      // const planName = dimension.replace(/Tier$/i, '');

      // const plan = await query(
      //   `
      //     SELECT id, title, duration
      //     FROM plans
      //     WHERE LOWER(title) = LOWER($1) AND duration = 'Monthly' AND active = TRUE
      //     LIMIT 1;
      //   `,
      //   [planName]
      // );


      // if (!plan?.rows?.length) {
      //   throw new CustomError(`Plan "${planName}" (Monthly) not found in plans table`, 404);
      // }

      // const selectedPlanId = plan.rows[0].id;

      // if (selectedPlanId) {
      //   await query(
      //     `
      //       UPDATE public.organizations
      //       SET plan_id = $1,
      //           plan_start_date = $2, 
      //           updated_at = CURRENT_TIMESTAMP
      //       WHERE org_id = $3;
      //     `,
      //     [selectedPlanId, entitlementRow.created_at, orgId]
      //   );
      // }

    }


    const user = await query(
      'INSERT INTO users (email, password, name, org_id, contact_number, role_id, primary_contact) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [params.email, hashedPassword, params.name, orgId, params.wpNumber, roleId, isNewCompany]
    );

    const userId = user.rows[0].user_id;

    const defaultCategories = [
      'Policies & Procedures',
      'Training & Onboarding',
      'Product / Service Information',
      'Legal & Compliance',
      'Technical / Operational Documentation',
    ];

    for (const category of defaultCategories) {
      await query(
        `INSERT INTO document_category (name, org_id, added_by) VALUES ($1, $2, $3)`,
        [category, orgId, userId]
      );
    }

    if (awsCustomerId) {
      const sessionToken = getCookie(event, 'aws_marketplace_session')

      await query(
        `
          UPDATE aws_marketplace_sessions
          SET consumed = true
          WHERE session_token = $1
          `,
        [sessionToken]
      )

      // Clear cookie
      setCookie(event, 'aws_marketplace_session', '', {
        path: '/',
        maxAge: 0
      })
    }


    await sendWelcomeMail(params.name, params.email, params.password, appLink);

    // Notify sales team about new organization onboarding (non-blocking)
    try {
      const configInner = useRuntimeConfig();
      await sendOrganizationOnboardedMail({
        orgName: params.companyName,
        adminName: params.name,
        adminEmail: params.email,
        adminPhone: params.wpNumber,
        domain: configInner.public.appUrl || 'unknown',
      });
    } catch (notifyErr) {
      console.warn('Failed to send onboarding notification to sales team:', notifyErr);
    }

    setResponseStatus(event, 201);

    return {
      statusCode: 201,
      status: 'success',
      data: user.rows[0],
    };
  } catch (error: unknown) {
    console.error('Signup error:', JSON.stringify(error, null, 2));

    if (error instanceof CustomError) {
      setResponseStatus(event, error.statusCode);
      return {
        statusCode: error.statusCode,
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }

    if (error instanceof Error) {
      setResponseStatus(event, 500);
      return {
        statusCode: 500,
        status: 'error',
        message: error.message || 'An unexpected error occurred during signup',
        timestamp: new Date().toISOString()
      };
    }

    setResponseStatus(event, 500);
    return {
      statusCode: 500,
      status: 'error',
      message: 'An unknown error occurred during signup',
      timestamp: new Date().toISOString()
    };
  }
});
