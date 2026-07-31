import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { authMiddleware } from "./auth.js";

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  await authMiddleware(req, res, async () => {
    try {
      const db = await getDb();
      const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
