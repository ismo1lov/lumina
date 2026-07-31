import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.userId!))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const { isRead } = z.object({ isRead: z.boolean() }).parse(req.body);
    const db = await getDb();
    await db
      .update(notifications)
      .set({ isRead })
      .where(eq(notifications.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = await getDb();
    await db.delete(notifications).where(eq(notifications.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
