// /server/api/analytics/[id]/department-analytics.get.ts
import { defineEventHandler, getQuery, getRouterParam } from 'h3';
import { query } from '../../../utils/db';
import { CustomError } from '../../../utils/custom.error';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const org_id = getRouterParam(event, 'id');
    const token = event.node.req.headers['authorization']?.split(' ')[1];

    // -------------------------
    // AUTH CHECK
    // -------------------------
    if (!token) {
        throw new CustomError('Unauthorized: No token provided', 401);
    }

    let decoded: any;
    let userId: string | undefined;
    try {
        decoded = jwt.verify(token, config.jwtToken as string);
        userId = (decoded as any).user_id;
    } catch {
        throw new CustomError('Unauthorized: Invalid token', 401);
    }

    // Get caller role and department
    const userRes = await query(
        `SELECT u.role_id, ud.dept_id 
         FROM users u
         LEFT JOIN user_departments ud ON u.user_id = ud.user_id AND ud.org_id = $2
         WHERE u.user_id = $1 
         LIMIT 1`,
        [userId, org_id]
    );

    const callerRole = Number.isFinite(Number(userRes?.rows?.[0]?.role_id)) 
        ? Number(userRes.rows[0].role_id) 
        : null;
    const callerDeptId = userRes?.rows?.[0]?.dept_id;

    // Super admin check
    if (callerRole !== 0) {
        if (decoded.org_id !== org_id) {
            throw new CustomError("Forbidden: You don't have access to this organization", 403);
        }
    }

    // Validate org exists
    const orgExistsResult = await query(
        'SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1',
        [org_id]
    );
    if (orgExistsResult.rowCount === 0) {
        throw new CustomError('Organization not found', 404);
    }

    // Get query params
    const { startDate, endDate, timezone } = getQuery(event);
    
    const params: (string | null | undefined)[] = [org_id];
    if (startDate && endDate) {
        params.push(String(startDate), String(endDate));
        if (timezone) {
            params.push(String(timezone));
        } else {
            params.push(null);
        }
    } else {
        params.push(null, null, null);
    }

    try {
        // First, get all departments
        const deptResult = await query(
            `SELECT dept_id, name FROM organization_departments WHERE org_id = $1`,
            [org_id]
        );
        
        // Get ALL users in the organization (excluding super admin)
        const allUsersQuery = `
            SELECT
                u.user_id,
                u.role_id
            FROM users u
            WHERE u.org_id = $1
                AND u.role_id != 0  -- Exclude super admin
                AND ($2::text IS NULL OR ((u.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date)
        `;
        
        const allUsersResult = await query(allUsersQuery, [org_id, params[1], params[2], params[3]]);
        const allUsers = allUsersResult.rows;
        
        // Separate admins and non-admins
        const adminUsers = allUsers.filter(u => u.role_id === 1);
        const nonAdminUsers = allUsers.filter(u => u.role_id !== 1);
        
        // Get department assignments for ALL users (including admins, though admins might not have assignments)
        const userDeptAssignmentsQuery = `
            SELECT 
                user_id,
                dept_id
            FROM user_departments
            WHERE org_id = $1
        `;
        
        const userDeptAssignmentsResult = await query(userDeptAssignmentsQuery, [org_id]);
        
        // Create a map of user_id to their departments
        const userDeptMap = new Map();
        userDeptAssignmentsResult.rows.forEach(row => {
            if (!userDeptMap.has(row.user_id)) {
                userDeptMap.set(row.user_id, []);
            }
            userDeptMap.get(row.user_id).push(row.dept_id);
        });
        
        // Get artifact counts per department
        const artifactCountsQuery = `
            SELECT
                dd.dept_id,
                COUNT(DISTINCT od.id)::int as artifact_count
            FROM organization_documents od
            LEFT JOIN document_departments dd ON od.id = dd.document_id
            WHERE od.org_id = $1
                AND ($2::text IS NULL OR ((od.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date)
            GROUP BY dd.dept_id
        `;

        const artifactCountsResult = await query(artifactCountsQuery, [org_id, params[1], params[2], params[3]]);

        // Get common artifacts (no department assigned)
        const commonArtifactsQuery = `
            SELECT COUNT(DISTINCT od.id)::int AS artifact_count
            FROM organization_documents od
            WHERE od.org_id = $1
                AND NOT EXISTS (
                    SELECT 1 FROM document_departments dd
                    WHERE dd.document_id = od.id
                )
                AND ($2::text IS NULL OR ((od.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date)
        `;

        const commonArtifactsResult = await query(commonArtifactsQuery, [org_id, params[1], params[2], params[3]]);
        
        // Build artifact count map
        const artifactCountMap = new Map();
        artifactCountsResult.rows.forEach(row => {
            if (row.dept_id) {
                artifactCountMap.set(row.dept_id, row.artifact_count);
            }
        });
        
        // Build bar chart data
        const barChartData = [];
        
        // For each department, count users (including admins)
        deptResult.rows.forEach(dept => {
            // Count users in this department:
            // 1. All admins (they have access to all departments)
            // 2. Non-admin users assigned to this department
            let userCount = adminUsers.length; // Start with all admins
            
            // Add non-admin users assigned to this department
            nonAdminUsers.forEach(user => {
                const userDepts = userDeptMap.get(user.user_id) || [];
                if (userDepts.includes(dept.dept_id)) {
                    userCount++;
                }
            });
            
            barChartData.push({
                department_id: dept.dept_id,
                department_name: dept.name,
                user_count: userCount,
                artifact_count: artifactCountMap.get(dept.dept_id) || 0
            });
        });
        
        // FIXED: Common users should be ALL users (since everyone can access Common artifacts)
        // This includes both admins AND non-admin users
        const commonUserCount = allUsers.length; // All non-superadmin users
        
        const commonArtifactCount = parseInt(commonArtifactsResult.rows[0]?.artifact_count || '0');
        
        // Add Common department if there are any common artifacts
        // Common always has ALL users, even if artifact count is 0
        barChartData.push({
            department_id: null,
            department_name: 'Common',
            user_count: commonUserCount, // Now includes admins!
            artifact_count: commonArtifactCount
        });
        
        // Calculate total users for percentage calculations
        const totalUsers = allUsers.length;
        
        // Build pie chart data
        const pieChartData = [];
        
        // Add regular departments
        deptResult.rows.forEach(dept => {
            // Find the corresponding bar chart data for this department
            const deptData = barChartData.find(d => d.department_id === dept.dept_id);
            if (deptData) {
                pieChartData.push({
                    name: dept.name,
                    users: deptData.user_count,
                    percentage: totalUsers > 0 ? ((deptData.user_count / totalUsers) * 100).toFixed(1) : '0.0'
                });
            }
        });
        
        // Add Common users (now includes admins)
        pieChartData.push({
            name: 'Common',
            users: commonUserCount,
            percentage: totalUsers > 0 ? ((commonUserCount / totalUsers) * 100).toFixed(1) : '0.0'
        });
        
        // Sort pie chart data by user count descending
        pieChartData.sort((a, b) => b.users - a.users);
        
        // Calculate max value for bar chart scaling
        const maxUserCount = Math.max(...barChartData.map(d => d.user_count), 0);
        const maxArtifactCount = Math.max(...barChartData.map(d => d.artifact_count), 0);
        const maxValue = Math.max(maxUserCount, maxArtifactCount);

        return {
            statusCode: 200,
            data: {
                bar_chart_data: barChartData,
                pie_chart_data: pieChartData,
                meta: {
                    max_value: maxValue
                }
            },
            message: 'Department analytics fetched successfully',
            meta: {
                org_id,
                startDate: startDate || null,
                endDate: endDate || null,
                timezone: timezone || null,
                user_role: callerRole,
                department_id: callerDeptId || null
            }
        };
    } catch (error: any) {
        console.error('Error message:', error.message);
        throw new CustomError(
            `Internal Server Error: Failed to fetch department analytics - ${error.message}`,
            500
        );
    }
});
