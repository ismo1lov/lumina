import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export async function getDb() {
  if (!db) {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL!,
    });
    db = drizzle(connection, { schema, mode: "default" }) as any;
  }
  return db!;
}

export { schema };
