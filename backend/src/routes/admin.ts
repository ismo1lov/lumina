import { Router } from "express";
import { z } from "zod";
import { eq, ne, desc, asc, count, sum } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { getDb } from "../db/index.js";
import { users, orders, orderItems, contacts, addresses, notifications } from "../db/schema.js";
import { adminMiddleware } from "../middleware/admin.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";

const router = Router();
router.use(adminMiddleware);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATAR_DIR = path.join(__dirname, "../../uploads/avatars");

function saveAvatar(userId: string, dataUrl: string): string {
  const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid image format. Use PNG, JPG or WebP.");
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > 2 * 1024 * 1024) throw new Error("Image too large (max 2MB)");
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  for (const f of fs.readdirSync(AVATAR_DIR)) {
    if (f.startsWith(userId + ".")) fs.unlinkSync(path.join(AVATAR_DIR, f));
  }
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  fs.writeFileSync(path.join(AVATAR_DIR, `${userId}.${ext}`), buf);
  return `/uploads/avatars/${userId}.${ext}`;
}

router.get("/stats", async (_req, res) => {
  try {
    const db = await getDb();

    const [userCount] = await db
      .select({ c: count() })
      .from(users)
      .where(ne(users.role, "admin"));
    const [orderCount] = await db.select({ c: count() }).from(orders);
    const [revenueRow] = await db.select({ total: sum(orders.total) }).from(orders);
    const [contactCount] = await db.select({ c: count() }).from(contacts);
    const [pendingCount] = await db
      .select({ c: count() })
      .from(orders)
      .where(eq(orders.status, "pending"));

    const recentOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    res.json({
      users: userCount.c,
      orders: orderCount.c,
      revenue: revenueRow.total ?? 0,
      contacts: contactCount.c,
      pendingOrders: pendingCount.c,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders", async (_req, res) => {
  try {
    const db = await getDb();

    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        subtotal: orders.subtotal,
        total: orders.total,
        shippingAddress: orders.shippingAddress,
        payment: orders.payment,
        delivery: orders.delivery,
        createdAt: orders.createdAt,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    const allItems = await db
      .select()
      .from(orderItems)
      .orderBy(desc(orderItems.id));

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    res.json(
      orderRows.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

router.patch("/orders/:id", async (req, res) => {
  try {
    const { status } = z
      .object({ status: z.enum(ORDER_STATUSES) })
      .parse(req.body);

    const db = await getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    await db.update(orders).set({ status }).where(eq(orders.id, req.params.id));
    res.json({ success: true, status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    const db = await getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, req.params.id))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (order.status !== "cancelled") {
      res.status(400).json({ error: "Only cancelled orders can be deleted" });
      return;
    }

    await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
    await db.delete(orders).where(eq(orders.id, order.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const db = await getDb();

    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(ne(users.role, "admin"))
      .orderBy(asc(users.role), desc(users.createdAt));

    const orderCounts = await db
      .select({ userId: orders.userId, c: count() })
      .from(orders)
      .groupBy(orders.userId);

    const countByUser = new Map(orderCounts.map((r) => [r.userId, r.c]));

    res.json(
      userRows.map((u) => ({
        ...u,
        orderCount: countByUser.get(u.id) ?? 0,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/contacts", async (_req, res) => {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        id: contacts.id,
        userId: contacts.userId,
        name: contacts.name,
        email: contacts.email,
        phone: contacts.phone,
        subject: contacts.subject,
        message: contacts.message,
        reply: contacts.reply,
        repliedAt: contacts.repliedAt,
        createdAt: contacts.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(contacts)
      .leftJoin(users, eq(contacts.userId, users.id))
      .orderBy(desc(contacts.createdAt));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/contacts/:id/reply", async (req, res) => {
  try {
    const { reply } = z
      .object({ reply: z.string().min(1).max(5000) })
      .parse(req.body);

    const db = await getDb();
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, req.params.id))
      .limit(1);
    if (!contact) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    await db
      .update(contacts)
      .set({ reply, repliedAt: new Date() })
      .where(eq(contacts.id, contact.id));

    if (contact.userId) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: contact.userId,
        title: "Reply from Lumina",
        body: reply,
      });
    }

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

router.delete("/contacts/:id", async (req, res) => {
  try {
    const db = await getDb();
    await db.delete(contacts).where(eq(contacts.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.params.id))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(desc(addresses.createdAt));

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    const allItems = await db
      .select()
      .from(orderItems)
      .orderBy(desc(orderItems.id));

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      addresses: userAddresses,
      orders: userOrders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const { name, email, username, avatar } = z
      .object({
        name: z.string().min(2).max(255).optional(),
        email: z.string().email().optional(),
        username: z
          .string()
          .min(2)
          .max(30)
          .regex(/^[a-zA-Z0-9._-]+$/, "Login can only contain letters, numbers, dots, dashes and underscores")
          .optional(),
        avatar: z.string().max(5_000_000).optional().or(z.literal("")),
      })
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

    const update: { name?: string; email?: string; username?: string; avatar?: string } = {};
    if (name && name !== user.name) update.name = name;
    if (email && email !== user.email) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing && existing.id !== user.id) {
        res.status(400).json({ error: "Email already registered" });
        return;
      }
      update.email = email;
    }
    if (username && username !== user.username) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      if (existing && existing.id !== user.id) {
        res.status(400).json({ error: "Login already taken" });
        return;
      }
      update.username = username;
    }
    if (avatar !== undefined) {
      update.avatar = avatar === "" ? "" : saveAvatar(user.id, avatar);
    }

    if (Object.keys(update).length > 0) {
      await db.update(users).set(update).where(eq(users.id, user.id));
    }

    res.json({
      user: {
        id: user.id,
        name: update.name ?? user.name,
        email: update.email ?? user.email,
        username: update.username ?? user.username,
        role: user.role,
        avatar: update.avatar ?? user.avatar,
      },
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

router.patch("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      })
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

export default router;
