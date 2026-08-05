import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { contacts, users } from "../db/schema.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, phone, subject, message } = z
      .object({
        name: z.string().min(2).max(255),
        email: z.string().email().optional(),
        phone: z.string().max(50).optional(),
        subject: z.string().min(2).max(255).optional(),
        message: z.string().min(10),
      })
      .parse(req.body);

    let userId = "";
    let userEmail = "";
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const { verifyToken } = await import("../lib/auth.js");
      const payload = verifyToken(header.slice(7));
      if (payload) userId = payload.userId;
    }

    const db = await getDb();
    if (userId) {
      const [u] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (u) userEmail = u.email;
      else userId = "";
    }

    if (!userEmail && !req.body.email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const email = userEmail || req.body.email;

    await db.insert(contacts).values({
      id: crypto.randomUUID(),
      userId,
      name,
      email,
      phone: phone ?? "",
      subject: subject ?? userEmail ?? "Message from website",
      message,
    });

    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

export default router;
