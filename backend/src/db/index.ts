import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

const DB_USER = process.env.DB_USER || process.env.MYSQLUSER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
const DB_NAME = process.env.DB_NAME || process.env.MYSQLDATABASE || "lumina";
const DB_HOST = process.env.DB_HOST || process.env.MYSQLHOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

async function connect() {
  const useSsl = DB_HOST.includes("tidbcloud.com");
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (uri) {
    return await mysql.createConnection({ uri, ssl: useSsl ? { rejectUnauthorized: true } : undefined });
  }
  return await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  });
}

export async function getDb() {
  if (!db) {
    const connection = await connect();
    db = drizzle(connection, { schema, mode: "default" }) as any;
  }
  return db!;
}

export { schema };
