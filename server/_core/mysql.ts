import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

function parseSslOption(rawSsl: string | null) {
  if (!rawSsl) {
    return undefined;
  }

  const normalized = rawSsl.trim().replace(/^['"]|['"]$/g, "");
  const candidate = normalized.replace(/\\"/g, '"').replace(/\\'/g, "'");

  if (!candidate) {
    return undefined;
  }

  if (candidate === "true") {
    return { rejectUnauthorized: true };
  }

  if (candidate === "false") {
    return undefined;
  }

  if (candidate.startsWith("{") || candidate.startsWith("[")) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      console.warn(
        "[Database] Invalid ssl JSON in DATABASE_URL, ignoring:",
        error
      );
      return undefined;
    }
  }

  return candidate;
}

export function buildMysqlPoolConfig(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const ssl = parseSslOption(url.searchParams.get("ssl"));

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl,
    // TiDB closes idle connections without always telling the client. With
    // keep-alive off, the next query on such a socket waits for TCP to give
    // up, which can take minutes. Probe idle sockets and drop them early.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    idleTimeout: 60_000,
    maxIdle: 3,
    connectTimeout: 10_000,
  };
}

export function createDrizzleFromDatabaseUrl(databaseUrl: string) {
  const pool = mysql.createPool(buildMysqlPoolConfig(databaseUrl));
  return drizzle(pool);
}

export type DrizzleDb = ReturnType<typeof createDrizzleFromDatabaseUrl>;
