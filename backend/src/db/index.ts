import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;
let pool: mysql.Pool | undefined;

const DB_USER = process.env.DB_USER || process.env.MYSQLUSER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
const DB_NAME = process.env.DB_NAME || process.env.MYSQLDATABASE || "lumina";
const DB_HOST = process.env.DB_HOST || process.env.MYSQLHOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

function createPool() {
  const useSsl = DB_HOST.includes("tidbcloud.com");
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  const options = {
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  };

  if (uri) {
    return mysql.createPool({ uri, ...options });
  }

  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ...options,
  });
}

export async function getDb() {
  if (!db) {
    pool = createPool();
    db = drizzle(pool, { schema, mode: "default" }) as any;
  }
  return db!;
}

export { schema };
