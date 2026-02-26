import { defineEventHandler, getRouterParam, getQuery } from "h3";
import { query } from "../../../utils/db";
import { CustomError } from "../../../utils/custom.error";
import jwt from "jsonwebtoken";
import { groupSimilarTexts } from "~/server/utils/embeddingUtils";
import { cleanText } from "~/server/utils/cleanText";

// Simple in-memory cache for organization analytics responses
const ORG_ANALYTICS_CACHE_TTL = 1000 * 60 * 60; // 1 hour
const orgAnalyticsCache: Map<string, { ts: number; data: any }> = new Map();

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const org_id = getRouterParam(event, "id");
    const token = event.node.req.headers["authorization"]?.split(" ")[1];
    const handlerStart = Date.now();

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

    // Determine caller role. Super admins (role_id === 0) are allowed to access any org.
    const roleRes = await query(`SELECT role_id, user_id FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
    // Debug logging

    const callerRoleRaw = roleRes?.rows?.[0]?.role_id
    const callerRole = Number.isFinite(Number(callerRoleRaw)) ? Number(callerRoleRaw) : null

    // If caller is not superadmin, ensure the organization exists and they have access to it.
    if (callerRole !== 0) {
        const accessCheck = await query(
            `SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1`,
            [org_id]
        );
        if (accessCheck.rowCount === 0) {
            throw new CustomError("Forbidden: You don't have access to this organization", 403);
        }
    } else {
        // For superadmins, still validate the org exists; return 404 if missing
        const orgExistCheck = await query(`SELECT 1 FROM organizations WHERE org_id = $1`, [org_id]);
        if (orgExistCheck.rowCount === 0) {
            throw new CustomError("Organization not found", 404);
        }
    }

    // Extract query params
    const { startDate, endDate, timezone } = getQuery(event);

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
            AND (o.plan_start_date IS NULL OR t.created_at >= o.plan_start_date)
        ), 0) AS total_tokens,
        p.id AS plan_id,
        p.title AS plan_title,
        p.price_currency,
        p.price_amount,
        p.duration,
        p.users AS plan_users,
        p.limit_requests,
        p.features
    FROM organizations o
        LEFT JOIN users u ON o.org_id = u.org_id AND u.role_id IS DISTINCT FROM '0'
        LEFT JOIN plans p ON o.plan_id = p.id
        LEFT JOIN organization_documents d ON o.org_id = d.org_id
    WHERE o.org_id = $1
    GROUP BY o.org_id, p.id
  `;

    // Build dynamic filters
    let questionFilter = "";
    const params: any[] = [org_id];

    if (startDate && endDate) {
        if (timezone) {
            // Compare dates in the provided timezone to avoid off-by-one-day issues
            // Explicitly treat created_at as UTC, then convert to user's timezone
            questionFilter = "AND ((created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date";
            params.push(startDate, endDate, timezone);
        } else {
            // Fallback: compare by date (assume UTC)
            questionFilter = "AND (created_at AT TIME ZONE 'UTC')::date BETWEEN $2::date AND $3::date";
            params.push(startDate, endDate);
        }
    }

    const allQuestionsQuery = `
    SELECT question_text
        FROM token_cost_calculation
        WHERE org_id = $1
          AND question_text IS NOT NULL
          
          AND question_text NOT ILIKE 'document summarization:%'
        ${questionFilter}
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
            WHERE org_id = $1
              AND document_source IS NOT NULL
              AND question_text IS NOT NULL
              
              AND question_text NOT ILIKE 'document summarization:%'
              ${questionFilter}
            GROUP BY document_source
            ORDER BY reference_count DESC
            LIMIT 5
        ) d
        LEFT JOIN LATERAL (
            SELECT DISTINCT question_text
            FROM token_cost_calculation
            WHERE org_id = $1
              AND document_source = d.document_source
              AND question_text IS NOT NULL
              
              AND question_text NOT ILIKE 'document summarization:%'
              ${questionFilter}
            LIMIT 20
        ) q ON true
        GROUP BY d.document_source, d.reference_count
    `;

    const totalQueriesQuery = `
        SELECT COUNT(DISTINCT id) AS total
        FROM token_cost_calculation
        WHERE org_id = $1
        AND COALESCE(question_text, '') NOT ILIKE 'document summarization:%'
        AND ($2::timestamp IS NULL OR created_at >= $2::timestamp);
    `;

    try {
        const dbStart = Date.now();
        const [{ rows: orgRows }, { rows: questionRows }, { rows: topDocumentsRows }] =
            await Promise.all([
                query(orgQuery, [org_id]),
                query(allQuestionsQuery, params),
                query(topDocumentsQuery, params),
            ]);

        const organizationDetails = orgRows[0];
        const planStartDate = organizationDetails?.plan_start_date || null;

        const { rows: totalQueriesRows } = await query(totalQueriesQuery, [org_id, planStartDate]);
        const dbElapsed = Date.now() - dbStart;
        // if (process.dev) console.log(`DB queries completed in ${dbElapsed}ms`);

        const rawQuestions = questionRows.map((q: { question_text: string }) =>
            (q.question_text || '').toString().trim()
        );

        const totalQueries =
            totalQueriesRows && totalQueriesRows[0]
                ? Number(totalQueriesRows[0].total || 0)
                : 0;

        // Prepare questions: keep original question text (so representative remains as stored in DB),
        // but filter out entries that cleanText would consider empty (emoji-only etc) and truncate long texts.
        const groupingInputs = rawQuestions
            .map((q) => (q || '').slice(0, 4000)) // truncate extremely long inputs
            .filter((q) => !!cleanText(q || ''));

        const cleanedQuestions = rawQuestions
            .map((q) => cleanText(q || ''))
            .map((s) => (s || '').slice(0, 4000)) // truncated cleaned versions for embedding use if needed
            .filter((s) => !!s);

        const removedCount = rawQuestions.length - groupingInputs.length;
        if (removedCount > 0) {
            if (process.dev) console.log(`Removed ${removedCount} empty/emoji-only questions before embedding for org ${org_id}`);
        }

        // Debug: expose cleaned count for easier troubleshooting
        // try {
        //     // if (process.dev) console.log(`ANALYTICS_CLEANED_QUESTIONS_COUNT: org=${org_id} raw=${rawQuestions.length} cleaned=${groupingInputs.length}`);
        // } catch (e) { }

        let groupedQuestions = [] as any[];
        try {
            // Use conservative batch size to avoid Bedrock validation errors
            const MAX_EMBED_BATCH = 64;

            if (groupingInputs.length === 0) {
                groupedQuestions = [];
            } else if (groupingInputs.length <= MAX_EMBED_BATCH) {
                // Lower similarity threshold slightly and enable fuzzy (edit-distance) merging
                groupedQuestions = await groupSimilarTexts(groupingInputs, 0.8, 10, { fuzzyMerge: true, maxEditDistance: 2, relativeEditDistance: 0.18 });
            } else {
                // Chunk the inputs into batches compatible with embedding limits
                const chunks: string[][] = [];
                for (let i = 0; i < groupingInputs.length; i += MAX_EMBED_BATCH) {
                    chunks.push(groupingInputs.slice(i, i + MAX_EMBED_BATCH));
                }

                const allClusters: { representative: string; similar_questions: string[]; total_count: number }[] = [];

                // Helper to process a chunk with retries by splitting if necessary
                const processChunk = async (chunkItems: string[]): Promise<void> => {
                    try {
                        const partial = await groupSimilarTexts(chunkItems, 0.85);
                        if (Array.isArray(partial) && partial.length) {
                            allClusters.push(...partial);
                        }
                    } catch (chunkErr) {
                        if (process.dev) console.error('groupSimilarTexts failed for a chunk of organization questions:', chunkErr);

                        // If chunk has more than 1 item, try splitting and processing halves to avoid model errors
                        if (chunkItems.length > 1) {
                            const mid = Math.floor(chunkItems.length / 2);
                            const left = chunkItems.slice(0, mid);
                            const right = chunkItems.slice(mid);
                            // Process halves sequentially to avoid parallel load
                            await processChunk(left);
                            await processChunk(right);
                            return;
                        }

                        // If single item or splitting didn't help, fallback to frequency-based grouping for this single item
                        try {
                            const q = chunkItems[0];
                            const cleaned = cleanText(q || '') || q || '';
                            const key = cleaned.toLowerCase().trim();
                            if (!key) return;
                            // push as single cluster
                            allClusters.push({ representative: q, similar_questions: [q], total_count: 1 });
                        } catch (fallbackErr) {
                            if (process.dev) console.error('Fallback grouping also failed for chunk:', fallbackErr);
                        }
                    }
                };

                // Parallelize chunk processing with limited concurrency
                const concurrency = 3; // increased concurrency as requested
                const tasks = chunks.map((chunk, idx) => async () => {
                    const chunkStart = Date.now();
                    try {
                        // if (process.dev) console.log(`Processing chunk idx=${idx} size=${chunk.length} (sample first 3):`, chunk.slice(0, 3));
                        await processChunk(chunk);
                        const elapsed = Date.now() - chunkStart;
                        // if (process.dev) console.log(`Chunk idx=${idx} processed in ${elapsed}ms`);
                        return { idx, success: true, elapsed };
                    } catch (e) {
                        const elapsed = Date.now() - chunkStart;
                        // if (process.dev) console.error(`Chunk idx=${idx} failed after ${elapsed}ms`, e);
                        return { idx, success: false, elapsed, error: e };
                    }
                });

                // Simple worker pool runner
                const runWithConcurrency = async (taskFns: Array<() => Promise<any>>, limit: number) => {
                    const results: any[] = new Array(taskFns.length);
                    let i = 0;
                    const workers: Promise<void>[] = [];
                    const runWorker = async () => {
                        while (i < taskFns.length) {
                            const current = i++;
                            try {
                                const res = await taskFns[current]();
                                results[current] = res;
                            } catch (err) {
                                results[current] = { error: err };
                            }
                        }
                    };
                    for (let w = 0; w < Math.min(limit, taskFns.length); w++) {
                        workers.push(runWorker());
                    }
                    await Promise.all(workers);
                    return results;
                };

                const taskStart = Date.now();
                const taskResults = await runWithConcurrency(tasks, concurrency);
                const totalChunkTime = Date.now() - taskStart;
                // if (process.dev) console.log(`All chunks processed in ${totalChunkTime}ms`);

                // Merge clusters by cleaned representative to combine duplicates across chunks
                const mergedMap = new Map<string, { representative: string; similar_questions: string[]; total_count: number }>();
                for (const c of allClusters) {
                    const key = cleanText(c.representative || '') || (c.representative || '');
                    const existing = mergedMap.get(key);
                    if (existing) {
                        // append similar questions (preserve duplicates) and sum counts
                        existing.similar_questions = [...(existing.similar_questions || []), ...(c.similar_questions || [])];
                        existing.total_count = Number((existing.total_count || 0) + (c.total_count || (c.similar_questions?.length || 0)));
                    } else {
                        mergedMap.set(key, {
                            representative: c.representative,
                            similar_questions: (c.similar_questions || []).slice(),
                            total_count: Number(c.total_count || (c.similar_questions?.length || 0)),
                        });
                    }
                }

                groupedQuestions = Array.from(mergedMap.values())
                    .sort((a, b) => (b.total_count || 0) - (a.total_count || 0))
                    .slice(0, 10);
            }
        } catch (grpErr) {
            // If embedding/grouping fails for this org, log and continue with empty grouping
            if (process.dev) console.error('groupSimilarTexts failed for organization questions:', grpErr);
            groupedQuestions = [];
        }

        const documents_analysis = await Promise.all(
            topDocumentsRows.map(
                async (doc: {
                    document_source: string;
                    reference_count: number;
                    questions: string[];
                }) => {
                    let grouped = [] as any[];
                    try {
                        // Lower threshold and enable fuzzy merging for document-level grouping to collapse typos
                        grouped = await groupSimilarTexts(doc.questions || [], 0.8, undefined, { fuzzyMerge: true, maxEditDistance: 2, relativeEditDistance: 0.18 });
                    } catch (docErr) {
                        if (process.dev) console.error(`groupSimilarTexts failed for document ${doc.document_source}:`, docErr);
                        grouped = [];
                    }

                    return {
                        document_source: doc.document_source,
                        reference_count: Number(doc.reference_count),
                        questions: grouped,
                    };
                }
            )
        );

        // Align top-level groupedQuestions representatives with per-document representatives where possible
        try {
            const normalizeKey = (s) => (cleanText(String(s || '')) || '').toLowerCase().replace(/\s+/g, ' ').trim();

            const docRepMap = new Map();
            const docSimilarMap = new Map();

            for (const doc of documents_analysis) {
                for (const q of (doc.questions || [])) {
                    const rep = q.representative || (q.similar_questions && q.similar_questions[0]) || '';
                    const k = normalizeKey(rep);
                    if (!k) continue;
                    if (!docRepMap.has(k)) docRepMap.set(k, rep);
                    else {
                        const existing = docRepMap.get(k);
                        if ((rep || '').length > (existing || '').length) docRepMap.set(k, rep);
                    }
                    const existingSimilar = docSimilarMap.get(k) || [];
                    docSimilarMap.set(k, existingSimilar.concat(q.similar_questions || []));
                }
            }

            for (const g of groupedQuestions) {
                const rep = g.representative || (g.similar_questions && g.similar_questions[0]) || '';
                const k = normalizeKey(rep);
                if (!k) continue;
                const docRep = docRepMap.get(k);
                if (docRep) {
                    g.representative = docRep;
                    const docSims = docSimilarMap.get(k) || [];
                    const merged = Array.from(new Set([...(g.similar_questions || []), ...docSims]));
                    g.similar_questions = merged.map((s) => String(s || '').trim());
                } else {
                    g.similar_questions = (g.similar_questions || []).map((s) => String(s || '').trim());
                }
            }
        } catch (alignErr) {
            if (process.dev) console.error('Alignment failed:', alignErr);
        }

        const responseData = {
            org_id: organizationDetails.org_id,
            org_name: organizationDetails.org_name,
            docs_uploaded: organizationDetails.docs_uploaded,
            total_users: organizationDetails.total_users,
            total_queries: totalQueries,
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
                        // add_ons_unlimited_requests:
                        //     organizationDetails.add_ons_unlimited_requests,
                        // add_ons_price: organizationDetails.add_ons_price,
                        features: organizationDetails.features,
                    },
                ]
                : [],
            questions: groupedQuestions,
            documents_analysis,
        };

        // Cache the response
        try {
            const cacheKeySet = `${org_id}::${startDate || ''}::${endDate || ''}::${timezone || ''}`;
            orgAnalyticsCache.set(cacheKeySet, { ts: Date.now(), data: responseData });
        } catch (e) {
            // ignore cache failures
        }

        const totalElapsed = Date.now() - handlerStart;
        // if (process.dev) console.log(`Analytics handler completed in ${totalElapsed}ms`);

        return {
            statusCode: 200,
            data: responseData,
            message: "Organization details fetched successfully",
        };
    } catch (error) {
        if (process.dev) console.error(error);
        throw new CustomError(
            "Internal Server Error: Failed to fetch organization details",
            500
        );
    }
});
