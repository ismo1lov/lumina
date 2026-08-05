import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../db/index.js";
import {
  users,
  cartItems,
  wishlistItems,
  orders,
  orderItems,
  addresses,
  notifications,
  contacts,
} from "../db/schema.js";
import { hashPassword, verifyPassword, signToken } from "../lib/auth.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(255) }).parse(req.body);

    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await db.update(users).set({ name }).where(eq(users.id, user.id));
    res.json({ user: { id: user.id, name, email: user.email, username: user.username, role: user.role, avatar: user.avatar } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(6) })
      .parse(req.body);

    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(newPassword) })
      .where(eq(users.id, user.id));

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

router.delete("/account", authMiddleware, async (req, res) => {
  try {
    const { password } = z.object({ password: z.string().min(1) }).parse(req.body);

    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.role === "admin") {
      res.status(403).json({ error: "Admin accounts cannot be deleted" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Password is incorrect" });
      return;
    }

    const userOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.userId, user.id));
    const orderIds = userOrders.map((o) => o.id);
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    }
    await db.delete(orders).where(eq(orders.userId, user.id));
    await db.delete(cartItems).where(eq(cartItems.userId, user.id));
    await db.delete(wishlistItems).where(eq(wishlistItems.userId, user.id));
    await db.delete(addresses).where(eq(addresses.userId, user.id));
    await db.delete(notifications).where(eq(notifications.userId, user.id));
    await db.delete(contacts).where(eq(contacts.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));

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

    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    const role = email === process.env.ADMIN_EMAIL ? "admin" : "user";
    await db.insert(users).values({ id, name, email, username: email, passwordHash, role });

    const token = signToken({ userId: id, email, role });
    res.json({ user: { id, name, email, username: email, role, avatar: "" }, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = z
      .object({ email: z.string().min(1), password: z.string() })
      .parse(req.body);

    const db = await getDb();
    const [user] = email.includes("@")
      ? await db.select().from(users).where(eq(users.email, email)).limit(1)
      : await db.select().from(users).where(eq(users.username, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid login or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid login or password" });
      return;
    }

    if (user.role !== "admin" && user.email === process.env.ADMIN_EMAIL) {
      await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
      user.role = "admin";
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
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

  res.json({ id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, avatar: user.avatar });
});

export default router;
