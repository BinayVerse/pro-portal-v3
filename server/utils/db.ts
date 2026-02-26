import pkg from "pg";
const { Pool } = pkg;

const config = useRuntimeConfig();

// Initialize a shared connection pool
const pool = new Pool({
  host: config.dbHost,
  port: parseInt(config.dbPort || "5432"),
  database: config.dbName,
  user: config.dbUser,
  password: config.dbPassword,
  // Pool configuration for better concurrency handling
  // Increased max to better handle bursts; tune as needed for your environment
  max: 50,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Gracefully handle pool errors without crashing the process
pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[db] Pool error:", err?.message || err);
});

function isTransientError(error: any): boolean {
  if (!error) return false;
  const code = error.code as string | undefined;
  const message = (error.message || "").toLowerCase();

  // Common transient/connection errors for Postgres/Node
  const transientPgCodes = new Set([
    // Class 08 — Connection Exception
    "08000", // connection_exception
    "08003", // connection_does_not_exist
    "08006", // connection_failure
    "08001", // sqlclient_unable_to_establish_sqlconnection
    "08004", // sqlserver_rejected_establishment_of_sqlconnection
    "08007", // transaction_resolution_unknown
    "08P01", // protocol_violation
    // Class 57 — Operator Intervention
    "57P01", // admin_shutdown
    "57P02", // crash_shutdown
    "57P03", // cannot_connect_now
    // Class 53 — Insufficient Resources
    "53300", // too_many_connections
  ]);

  if (code && transientPgCodes.has(code)) return true;

  // Node-level network errors
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EPIPE" ||
    code === "ECONNREFUSED"
  ) {
    return true;
  }

  // Message-based heuristics
  if (
    message.includes("terminat") || // connection terminated unexpectedly
    message.includes("timeout") ||
    message.includes("connection")
  ) {
    return true;
  }

  return false;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function query(text: string, params: any[] = [], opts?: { retries?: number; backoffMs?: number }) {
  // Use pool.query for simpler lifecycle; keep retries/backoff for transient errors
  const retries = Math.max(0, opts?.retries ?? 3);
  const backoffMs = Math.max(0, opts?.backoffMs ?? 250);

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error: any) {
      if (attempt < retries && isTransientError(error)) {
        attempt += 1;
        // eslint-disable-next-line no-console
        console.warn(`[db] Transient error on attempt ${attempt}, retrying in ${backoffMs}ms:`, error?.message || error);
        await delay(backoffMs);
        continue;
      }

      // Log the original DB error for debugging
      // eslint-disable-next-line no-console
      console.error('[db] Query error:', { message: error?.message, code: error?.code, stack: error?.stack })

      if (error?.code === "ECONNREFUSED") {
        throw new Error("Database connection refused - check if database is running");
      } else if (error?.code === "ENOTFOUND") {
        throw new Error("Database host not found - check database configuration");
      } else if (error?.code === "28P01") {
        throw new Error("Database authentication failed - check credentials");
      } else if (error?.code === "3D000") {
        throw new Error("Database does not exist - check database name");
      } else {
        // Propagate original message when available to aid debugging
        throw new Error(error?.message || "Database query failed");
      }
    }
  }
}

export async function getClient() {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    throw new Error("Database client connection failed");
  }
}

export async function testConnection() {
  try {
    await query("SELECT 1 as test", []);
    return true;
  } catch (error: any) {
    return false;
  }
}
