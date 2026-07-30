import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { contacts } from "../db/schema.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = z
      .object({
        name: z.string().min(2).max(255),
        email: z.string().email(),
        subject: z.string().min(2).max(255),
        message: z.string().min(10),
      })
      .parse(req.body);

    const db = await getDb();
    await db.insert(contacts).values({ id: crypto.randomUUID(), name, email, subject, message });

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

export default router;
