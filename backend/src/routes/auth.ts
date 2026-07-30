import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = z
      .object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) })
      .parse(req.body);

    const db = await getDb();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({ id, name, email, passwordHash });

    const token = signToken({ userId: id, email });
    res.json({ user: { id, name, email }, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string() })
      .parse(req.body);

    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token" });
    return;
  }

  const { verifyToken } = await import("../lib/auth.js");
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, name: user.name, email: user.email });
});

export default router;
