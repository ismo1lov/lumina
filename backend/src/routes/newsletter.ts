import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { newsletterSubscribers } from "../db/schema.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email().max(255) }).parse(req.body);
    const normalized = email.trim().toLowerCase();

    const db = await getDb();
    try {
      await db.insert(newsletterSubscribers).values({ email: normalized });
    } catch (err: any) {
      // Subscribing twice is not an error for the customer. Drizzle wraps the
      // driver error, so check both the error and its cause.
      const duplicate = err?.code === "ER_DUP_ENTRY" || err?.cause?.code === "ER_DUP_ENTRY";
      if (!duplicate) throw err;
    }

    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Please enter a valid email address" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
