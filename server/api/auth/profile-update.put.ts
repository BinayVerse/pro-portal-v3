import { defineEventHandler, readBody } from 'h3';
import { CustomError } from '../../utils/custom.error';
import { query } from '../../utils/db';
import { logWarn, logError } from '../../utils/logger';
import { generateResetLink, sendWelcomeMail, sendOrganizationOnboardedMail } from '../helper';
import { GoogleSignupValidation } from '../../utils/validations';
import jwt from 'jsonwebtoken';
import { isPersonalEmail, personalEmailDomains } from '../../utils/auth-utils';

const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
    const secret = config.jwtToken as string;

    try {
        const params = await readBody(event);
        const token = event.node.req.headers['authorization']?.split(' ')[1];

        if (!token) throw new CustomError('Unauthorized: No token provided', 401);

        const { user_id, name, email, company, contact_number, org_country, org_tax_id, billing_address } = params;

        /** ------------------------------------------------------------------
         * Detect Billing-Only Update
         * ------------------------------------------------------------------ */
        const isBillingOnly = !!billing_address &&
            !name &&
            !email &&
            !company &&
            !contact_number;

        /** ------------------------------------------------------------------
         * Fetch current user
         * ------------------------------------------------------------------ */
        const userQuery = `
            SELECT users.*, organizations.org_id, organizations.org_name AS company
            FROM users
            LEFT JOIN organizations ON users.org_id = organizations.org_id
            WHERE users.user_id = $1
        `;
        const userResult = await query(userQuery, [user_id]);
        if (!userResult.rows.length) throw new CustomError('User not found', 404);

        const currentUser = userResult.rows[0];
        let orgId = currentUser.org_id;

        let updates: string[] = [];
        let values: any[] = [];

        let billingUpdated = false;
        let isCompanyUpdated = false;
        let newToken: string | null = null;

        /** ------------------------------------------------------------------
         * VALIDATE USER FIELDS — ONLY IF NOT BILLING-ONLY
         * ------------------------------------------------------------------ */
        if (!isBillingOnly) {
            const requiredFields = ['name', 'email', 'contact_number', 'company'];
            for (const f of requiredFields) {
                if (!params[f]) throw new CustomError(`Please enter your ${f.replace('_', ' ')}`, 400);
            }

            const validation = GoogleSignupValidation.safeParse(params);
            if (!validation.success) {
                throw new CustomError(
                    `Validation error: ${validation.error.errors[0].message}`,
                    400
                );
            }

            if (name.length < 3 || company.trim().length < 3) {
                throw new CustomError(
                    'Name and Company name must be at least 3 characters long',
                    400
                );
            }
        }

        /** ------------------------------------------------------------------
         * EMAIL VALIDATION / UPDATE
         * ------------------------------------------------------------------ */
        if (!isBillingOnly && email && email !== currentUser.email) {
            const isCurrentPersonal = isPersonalEmail(currentUser.email, personalEmailDomains);
            const isNewPersonal = isPersonalEmail(email, personalEmailDomains);

            if (!isCurrentPersonal && isNewPersonal) {
                throw new CustomError(
                    'Please use a valid domain-based company email address',
                    403
                );
            }

            const emailCheck = await query(
                `SELECT user_id FROM users WHERE email = $1 AND user_id != $2`,
                [email, user_id]
            );
            if (emailCheck.rows.length) {
                throw new CustomError('Email is already in use by another user', 409);
            }

            updates.push(`email = $${updates.length + 1}`);
            values.push(email);
        }

        /** ------------------------------------------------------------------
         * CONTACT NUMBER VALIDATION / UPDATE
         * ------------------------------------------------------------------ */
        if (!isBillingOnly && contact_number && contact_number !== currentUser.contact_number) {
            const contactCheck = await query(
                `SELECT user_id FROM users WHERE contact_number = $1 AND user_id != $2`,
                [contact_number, user_id]
            );
            if (contactCheck.rows.length) {
                throw new CustomError('This WhatsApp number is already registered', 409);
            }

            updates.push(`contact_number = $${updates.length + 1}`);
            values.push(contact_number);
        }

        /** ------------------------------------------------------------------
         * COMPANY / ORG UPDATE
         * ------------------------------------------------------------------ */
        if (!isBillingOnly && company && company !== currentUser.company) {
            const companyExists = await query(
                `SELECT org_id FROM organizations WHERE org_name = $1`,
                [company]
            );
            if (companyExists.rows.length) {
                throw new CustomError('Company is already registered, please contact admin.', 409);
            }

            // Create new organization
            const newOrg = await query(
                `INSERT INTO organizations (org_name, created_at) VALUES ($1, NOW()) RETURNING org_id`,
                [company]
            );
            if (!newOrg.rows.length) throw new CustomError('Failed to create new company', 500);

            orgId = newOrg.rows[0].org_id;
            isCompanyUpdated = true;

            // Insert default categories
            const defaultCategories = [
                'Policies & Procedures',
                'Training & Onboarding',
                'Product / Service Information',
                'Legal & Compliance',
                'Technical / Operational Documentation',
            ];
            for (const c of defaultCategories) {
                await query(
                    `INSERT INTO document_category (name, org_id, added_by) VALUES ($1, $2, $3)`,
                    [c, orgId, user_id]
                );
            }

            // 🔑 Create 'Common' department as system department for new organization
            await query(
                `INSERT INTO organization_departments (org_id, name, description, status, created_by, is_system)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [orgId, 'Common', 'Default system department for managing common users and artifacts.', 'active', user_id, true]
            );

            // Update user org
            await query(
                `UPDATE users SET role_id = '1', org_id = $1, contact_number = $2 WHERE user_id = $3`,
                [orgId, contact_number, user_id]
            );

            // Generate new auth token
            newToken = jwt.sign({ user_id, email, org_id: orgId }, secret, { expiresIn: '1h' });

            updates.push(`org_id = $${updates.length + 1}`);
            values.push(orgId);
        }

        /** ------------------------------------------------------------------
         * NAME UPDATE
         * ------------------------------------------------------------------ */
        if (!isBillingOnly && name && name !== currentUser.name) {
            updates.push(`name = $${updates.length + 1}`);
            values.push(name);
        }

        /** ------------------------------------------------------------------
         * ORGANIZATION DETAILS UPDATE (ORG_COUNTRY & ORG_TAX_ID)
         * ------------------------------------------------------------------ */
        if (!isBillingOnly && (org_country || org_tax_id)) {
            const targetOrgId = orgId || currentUser.org_id;
            if (targetOrgId) {
                // Check for duplicate org_tax_id if provided
                if (org_tax_id) {
                    const existingTaxId = await query(
                        `SELECT org_id FROM organizations WHERE org_tax_id = $1 AND org_id != $2`,
                        [org_tax_id, targetOrgId]
                    );
                    if (existingTaxId?.rows?.length) {
                        throw new CustomError('This organization already exists in the system. Please contact admin for access.', 409);
                    }
                }

                const orgUpdates: string[] = [];
                const orgValues: any[] = [];

                if (org_country) {
                    orgUpdates.push(`org_country = $${orgUpdates.length + 1}`);
                    orgValues.push(org_country);
                }

                if (org_tax_id) {
                    orgUpdates.push(`org_tax_id = $${orgUpdates.length + 1}`);
                    orgValues.push(org_tax_id);
                }

                if (orgUpdates.length > 0) {
                    orgUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
                    orgValues.push(targetOrgId);

                    await query(
                        `UPDATE organizations SET ${orgUpdates.join(', ')} WHERE org_id = $${orgValues.length}`,
                        orgValues
                    );
                }
            }
        }

        /** ------------------------------------------------------------------
         * BILLING ADDRESS UPDATE (ALWAYS IN SEPARATE TABLE)
         * ------------------------------------------------------------------ */
        if (billing_address) {
            try {
                const billingData = {
                    org_id: orgId || currentUser.org_id,
                    address_line1: billing_address.address_line1 || null,
                    address_line2: billing_address.address_line2 || null,
                    address_city: billing_address.address_city || null,
                    address_state: billing_address.address_state || null,
                    address_zip: billing_address.address_zip || null,
                    address_country: billing_address.address_country || null,
                };

                const existingBilling = await query(
                    `SELECT id FROM billing_address WHERE org_id = $1 LIMIT 1`,
                    [billingData.org_id]
                );

                if (existingBilling.rows.length > 0) {
                    // UPDATE billing
                    await query(
                        `
                        UPDATE billing_address
                        SET address_line1 = $1, address_line2 = $2, address_city = $3,
                            address_state = $4, address_zip = $5, address_country = $6,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE org_id = $7
                        `,
                        [
                            billingData.address_line1,
                            billingData.address_line2,
                            billingData.address_city,
                            billingData.address_state,
                            billingData.address_zip,
                            billingData.address_country,
                            billingData.org_id
                        ]
                    );
                } else {
                    // INSERT billing
                    await query(
                        `
                        INSERT INTO billing_address (org_id, address_line1, address_line2, address_city, address_state, address_zip, address_country)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `,
                        [
                            billingData.org_id,
                            billingData.address_line1,
                            billingData.address_line2,
                            billingData.address_city,
                            billingData.address_state,
                            billingData.address_zip,
                            billingData.address_country
                        ]
                    );
                }

                billingUpdated = true;

            } catch (err) {
                logWarn('Billing address update error:', err);
            }
        }

        /** ------------------------------------------------------------------
         * HANDLE NO USER UPDATES BUT BILLING UPDATED
         * ------------------------------------------------------------------ */
        if (updates.length === 0 && billingUpdated) {
            return {
                statusCode: 200,
                message: "Billing address updated successfully",
                userId: user_id
            };
        }

        /** ------------------------------------------------------------------
         * HANDLE "NOTHING TO UPDATE" CASE
         * ------------------------------------------------------------------ */
        if (updates.length === 0 && !billingUpdated) {
            return {
                statusCode: 200,
                message: "Nothing to update",
                userId: currentUser.user_id
            };
        }

        /** ------------------------------------------------------------------
         * APPLY USER UPDATES
         * ------------------------------------------------------------------ */
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(user_id);

        const updateQuery = `
            UPDATE users SET ${updates.join(', ')}
            WHERE user_id = $${values.length}
            RETURNING user_id
            `;

        const updatedUser = await query(updateQuery, values);

        /** ------------------------------------------------------------------
         * SEND NOTIFICATIONS IF NEW COMPANY CREATED
         * ------------------------------------------------------------------ */
        if (isCompanyUpdated) {
            const { resetLink } = await generateResetLink(
                currentUser.email,
                config.public.appUrl,
                updatedUser.rows[0].user_id
            );

            await sendWelcomeMail(name, email, '', `${config.public.appUrl}/login`, resetLink);

            try {
                await sendOrganizationOnboardedMail({
                    orgName: company,
                    adminName: name,
                    adminEmail: email,
                    adminPhone: contact_number,
                    domain: config.public.appUrl,
                });
            } catch (err) { }
        }

        return {
            statusCode: isCompanyUpdated ? 201 : 200,
            message: 'Profile updated successfully',
            userId: updatedUser.rows[0].user_id,
            ...(isCompanyUpdated ? { authToken: newToken } : {}),
            billingUpdated,
        };

    } catch (err: any) {
        logError('Profile update error:', err);
        throw new CustomError(err.message || 'Internal Server Error', err.statusCode || 500);
    }
});
