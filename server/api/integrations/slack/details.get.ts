import { defineEventHandler, getHeaders, setResponseStatus } from "h3";
import { query } from "../../../utils/db";
import { CustomError } from "../../../utils/custom.error";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const headers = getHeaders(event);
  const authHeader = headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new CustomError("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.split(" ")[1];
  // Determine effective org: prefer query param for superadmin
  let orgId: string;
  let userId: any

  try {
    const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: number };
    userId = decoded.user_id;
  } catch {
    throw new CustomError("Invalid or expired token", 401);
  }

  const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
  if (!userRow?.rows?.length) {
    throw new CustomError('User not found', 404);
  }
  const tokenUserOrg = userRow.rows[0].org_id
  const tokenUserRole = userRow.rows[0].role_id

  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg;

  const result = await query(
    `SELECT team_id, team_name, org_id, status FROM slack_team_mappings WHERE org_id = $1 ORDER BY updated_at DESC LIMIT 1`,
    [orgId]
  );

  setResponseStatus(event, 200);

  if (result.rows.length === 0) {
    return {
      statusCode: 200,
      message: "No Slack team mapping found for this organization",
      data: {
        team_id: "",
        team_name: "",
        org_id: "",
        status: "",
      },
    };
  }

  return {
    statusCode: 200,
    message: "Slack team details fetched successfully",
    data: result.rows[0],
  };
});
