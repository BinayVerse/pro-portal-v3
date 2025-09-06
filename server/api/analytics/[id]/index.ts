import { defineEventHandler, getRouterParam } from "h3";
import { query } from "../../../utils/db";
import { CustomError } from "../../../utils/custom.error";
import jwt from "jsonwebtoken";
import { groupSimilarTexts } from "~/server/utils/embeddingUtils";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const org_id = getRouterParam(event, "id");
    const token = event.node.req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        throw new CustomError("Unauthorized: No token provided", 401);
    }

    let userId;
    try {
        const decodedToken = jwt.verify(token, config.jwtToken as string);
        userId = (decodedToken as { user_id: number }).user_id;
    } catch {
        throw new CustomError("Unauthorized: Invalid token", 401);
    }

    // access check
    const accessCheck = await query(
        `SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1`,
        [org_id]
    );
    if (accessCheck.rowCount === 0) {
        throw new CustomError("Forbidden: You don't have access to this organization", 403);
    }

    // Check if organization exists
    const orgExistCheck = await query(`SELECT 1 FROM organizations WHERE org_id = $1`, [org_id]);
    if (orgExistCheck.rowCount === 0) {
        throw new CustomError("Organization not found", 404);
    }

    const orgQuery = `
        SELECT 
            o.org_id,
            o.org_name,
            COUNT(DISTINCT d.id) AS docs_uploaded,
            o.plan_start_date,
            COUNT(DISTINCT u.user_id) AS total_users,
            COALESCE((
                SELECT SUM(t.total_tokens)
                FROM token_cost_calculation t
                WHERE t.org_id = o.org_id
            ), 0) AS total_tokens,
            p.id AS plan_id,
            p.title AS plan_title,
            p.price_currency,
            p.price_amount,
            p.duration,
            p.users AS plan_users,
            p.limit_requests,
            p.add_ons_unlimited_requests,
            p.add_ons_price,
            p.features
        FROM organizations o
            LEFT JOIN users u ON o.org_id = u.org_id AND u.role_id IS DISTINCT FROM '0'
            LEFT JOIN plans p ON o.plan_id = p.id
            LEFT JOIN organization_documents d ON o.org_id = d.org_id
        WHERE o.org_id = $1
        GROUP BY o.org_id, p.id
    `;

    const allQuestionsQuery = `
        SELECT question_text
        FROM token_cost_calculation
        WHERE org_id = $1 AND question_text IS NOT NULL
    `;

    const topDocumentsQuery = `
        SELECT 
            d.document_source,
            d.reference_count,
            JSON_AGG(q.question_text) AS questions
        FROM (
            SELECT 
                document_source,
                COUNT(*) AS reference_count
            FROM token_cost_calculation
            WHERE org_id = $1 AND document_source IS NOT NULL AND question_text IS NOT NULL
            GROUP BY document_source
            ORDER BY reference_count DESC
            LIMIT 5
        ) d
        LEFT JOIN LATERAL (
            SELECT DISTINCT question_text
            FROM token_cost_calculation
            WHERE org_id = $1 AND document_source = d.document_source AND question_text IS NOT NULL
            LIMIT 10
        ) q ON true
        GROUP BY d.document_source, d.reference_count
    `;

    try {
        const [{ rows: orgRows }, { rows: questionRows }, { rows: topDocumentsRows }] =
            await Promise.all([
                query(orgQuery, [org_id]),
                query(allQuestionsQuery, [org_id]),
                query(topDocumentsQuery, [org_id]),
            ]);

        const organizationDetails = orgRows[0];

        const rawQuestions = questionRows.map((q: { question_text: string }) =>
            q.question_text.trim()
        );

        const groupedQuestions = await groupSimilarTexts(rawQuestions, 0.9, 10);

        const documents_analysis = await Promise.all(
            topDocumentsRows.map(async (doc: { document_source: string; reference_count: number; questions: string[] }) => {
                const grouped = await groupSimilarTexts(doc.questions, 0.9);
                return {
                    document_source: doc.document_source,
                    reference_count: Number(doc.reference_count),
                    questions: grouped,
                };
            })
        );

        return {
            statusCode: 200,
            data: {
                org_id: organizationDetails.org_id,
                org_name: organizationDetails.org_name,
                docs_uploaded: organizationDetails.docs_uploaded,
                total_users: organizationDetails.total_users,
                total_tokens: organizationDetails.total_tokens,
                plan_start_date: organizationDetails.plan_start_date,
                plan: organizationDetails.plan_id
                    ? [
                        {
                            id: organizationDetails.plan_id,
                            title: organizationDetails.plan_title,
                            price: {
                                currency: organizationDetails.price_currency,
                                amount: organizationDetails.price_amount,
                            },
                            duration: organizationDetails.duration,
                            users: organizationDetails.plan_users,
                            limit_requests: organizationDetails.limit_requests,
                            add_ons_unlimited_requests: organizationDetails.add_ons_unlimited_requests,
                            add_ons_price: organizationDetails.add_ons_price,
                            features: organizationDetails.features,
                        },
                    ]
                    : [],
                questions: groupedQuestions,
                documents_analysis,
            },
            message: "Organization details fetched successfully",
        };
    } catch (error) {
        console.error(error);
        throw new CustomError(
            "Internal Server Error: Failed to fetch organization details",
            500
        );
    }
});
