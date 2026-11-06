import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { randomBytes, randomUUID } from "crypto";
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
  payments,
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
      await db.delete(payments).where(inArray(payments.orderId, orderIds));
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
    await db.insert(users).values({ id, name, email, username: email, passwordHash, role: "user" });

    const token = signToken({ userId: id, email, role: "user" });
    res.json({ user: { id, name, email, username: email, role: "user", avatar: "" }, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin-login", async (req, res) => {
  try {
    const { login, password } = z
      .object({ login: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);

    const adminLogin = process.env.ADMIN_LOGIN?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminLogin || !adminPassword) {
      res.status(503).json({
        error: "Admin login is not configured. Set ADMIN_LOGIN and ADMIN_PASSWORD.",
      });
      return;
    }

    if (login !== adminLogin || password !== adminPassword) {
      res.status(401).json({ error: "Invalid login or password" });
      return;
    }

    const db = await getDb();
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@lumina.uz";
    const [admin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    if (!admin) {
      const id = randomUUID();
      const passwordHash = await hashPassword(adminPassword);
      await db.insert(users).values({ id, name: "Admin", email: adminEmail, username: login, passwordHash, role: "admin" });
      const token = signToken({ userId: id, email: adminEmail, role: "admin" });
      res.json({ user: { id, name: "Admin", email: adminEmail, username: login, role: "admin", avatar: "" }, token });
      return;
    }

    const update: { role?: string; username?: string; passwordHash?: string } = {};
    if (admin.role !== "admin") update.role = "admin";
    if (admin.username !== login) update.username = login;
    if (!(await verifyPassword(password, admin.passwordHash))) {
      update.passwordHash = await hashPassword(adminPassword);
    }
    if (Object.keys(update).length > 0) {
      await db.update(users).set(update).where(eq(users.id, admin.id));
    }

    const token = signToken({ userId: admin.id, email: admin.email, role: "admin" });
    res.json({
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        username: login,
        role: "admin",
        avatar: admin.avatar,
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

    if (user.role === "admin") {
      res.status(403).json({ error: "Admin accounts must use the admin login" });
      return;
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

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_STATE_COOKIE = "google_oauth_state";

function getGoogleConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const redirectUri = "http://localhost:3001/api/auth/google/callback";
  return { clientId, clientSecret, redirectUri };
}

function getFrontendUrl(): string {
  return (process.env.PUBLIC_APP_URL || "http://localhost:5173").trim().replace(/\/+$/, "");
}

function getGoogleStateFromCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_STATE_COOKIE}=`));
  if (!match) return undefined;
  const value = match.slice(GOOGLE_STATE_COOKIE.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Step 1: send the browser to Google's consent screen.
router.get("/google", (req, res) => {
  try {
    const config = getGoogleConfig();
    if (!config) {
      res.status(503).json({ error: "Google sign-in is not configured" });
      return;
    }

    const state = randomBytes(16).toString("hex");
    res.cookie(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
      prompt: "select_account",
    });

    res.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Step 2: Google redirects back here with a code; exchange it, find/create the
// user by verified Google email and issue our own JWT for the storefront.
router.get("/google/callback", async (req, res) => {
  try {
    const config = getGoogleConfig();
    if (!config) {
      res.status(503).json({ error: "Google sign-in is not configured" });
      return;
    }

    const { code, state } = req.query as { code?: string; state?: string };
    const frontendUrl = getFrontendUrl();
    const failRedirect = () => res.redirect(`${frontendUrl}/login?error=google`);

    if (!code || !state || state !== getGoogleStateFromCookie(req)) {
      failRedirect();
      return;
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = (await tokenRes.json().catch(() => null)) as { access_token?: string } | null;
    if (!tokenData?.access_token) {
      failRedirect();
      return;
    }

    const profileRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = (await profileRes.json().catch(() => null)) as { email?: string; name?: string } | null;
    const email = profile?.email;
    if (!email) {
      failRedirect();
      return;
    }
    const name = profile?.name || email.split("@")[0];

    const db = await getDb();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const id = existing?.id ?? randomUUID();
    const passwordHash = existing?.passwordHash ?? (await hashPassword(randomUUID()));
    const role = existing?.role ?? "user";

    if (!existing) {
      await db
        .insert(users)
        .values({ id, name, email, username: email, passwordHash, role });
    }

    const token = signToken({ userId: id, email, role });
    res.redirect(`${frontendUrl}/login?token=${token}`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
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
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({ id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, avatar: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
