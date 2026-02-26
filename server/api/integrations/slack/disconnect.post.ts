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

  // Check if a mapping exists before updating
  const checkMapping = await query(
    `SELECT access_token FROM slack_team_mappings WHERE org_id = $1 AND status = 'active'`,
    [orgId]
  );

  if (!checkMapping.rows.length) {
    throw new CustomError("No active Slack mapping found for this organization", 404);
  }

  const accessToken = checkMapping.rows[0].access_token;

  // Optional: Revoke token at Slack
  if (accessToken) {
    await fetch("https://slack.com/api/auth.revoke", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  // Set to inactive in DB and record who performed the action
  await query(
    `UPDATE slack_team_mappings SET status = 'inactive', updated_at = NOW(), updated_by = $1 WHERE org_id = $2`,
    [userId, orgId]
  );

  // Remove persistent notification suppression for slack so reconnect can notify again
  try {
    await query(
      `DELETE FROM channel_notifications WHERE org_id = $1 AND channel = $2`,
      [orgId, 'slack']
    );
  } catch (err) {
    console.warn('Failed to remove channel_notifications entry for slack:', err);
  }

  setResponseStatus(event, 200);
  return {
    statusCode: 200,
    message: 'Slack disconnected successfully'
  };
});
