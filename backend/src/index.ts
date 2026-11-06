import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./db/index.js";
import { seedProductsIfEmpty } from "./db/productSeed.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import contactRoutes from "./routes/contact.js";
import notificationRoutes from "./routes/notifications.js";
import addressRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";
import newsletterRoutes from "./routes/newsletter.js";

const DB_USER = process.env.DB_USER || process.env.MYSQLUSER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || "";
const DB_NAME = process.env.DB_NAME || process.env.MYSQLDATABASE || "lumina";
const DB_HOST = process.env.DB_HOST || process.env.MYSQLHOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

async function initDatabase() {
  const useSsl = DB_HOST.includes("tidbcloud.com");
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.query(`USE \`${DB_NAME}\``);

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL DEFAULT '',
      email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      avatar VARCHAR(500) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(100) PRIMARY KEY, name VARCHAR(255) NOT NULL,
      sku VARCHAR(50) NOT NULL, category VARCHAR(50) NOT NULL,
      price INT NOT NULL, material VARCHAR(100) NOT NULL,
      materials JSON NOT NULL, colors JSON NOT NULL, finishes JSON NOT NULL,
      rating DECIMAL(2,1) NOT NULL, reviews INT NOT NULL,
      image VARCHAR(500) NOT NULL, alt_image VARCHAR(500) NOT NULL,
      in_stock BOOLEAN DEFAULT TRUE, popularity INT DEFAULT 0,
      created_at VARCHAR(20) NOT NULL, width INT NOT NULL,
      description TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS cart_items (
      id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(100) NOT NULL, finish VARCHAR(100) DEFAULT '',
      color VARCHAR(100) DEFAULT '', assembly BOOLEAN DEFAULT FALSE,
      qty INT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY cart_unique (user_id, product_id, finish, color, assembly)
    )`,
    `CREATE TABLE IF NOT EXISTS wishlist_items (
      id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY wl_unique (user_id, product_id)
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending', subtotal INT NOT NULL,
      total INT NOT NULL, shipping_address JSON,
      payment VARCHAR(50) DEFAULT '', payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
      delivery VARCHAR(50) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id VARCHAR(36) PRIMARY KEY, order_id VARCHAR(36) NOT NULL,
      product_id VARCHAR(100) NOT NULL, name VARCHAR(255) NOT NULL,
      finish VARCHAR(100) DEFAULT '', color VARCHAR(100) DEFAULT '',
      assembly BOOLEAN DEFAULT FALSE, unit_price INT NOT NULL, qty INT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS addresses (
      id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
      label VARCHAR(100) DEFAULT 'Home', full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL, address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL, zip VARCHAR(20) DEFAULT '',
      lat VARCHAR(50) DEFAULT NULL, lng VARCHAR(50) DEFAULT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL DEFAULT '',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL, phone VARCHAR(50) NOT NULL DEFAULT '',
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL, body TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY notif_user_idx (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(36) PRIMARY KEY, order_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL, provider VARCHAR(20) NOT NULL,
      provider_transaction_id VARCHAR(100) NOT NULL DEFAULT '',
      amount INT NOT NULL, state VARCHAR(20) NOT NULL DEFAULT 'created',
      provider_create_time BIGINT NOT NULL DEFAULT 0,
      provider_perform_time BIGINT NOT NULL DEFAULT 0,
      provider_cancel_time BIGINT NOT NULL DEFAULT 0,
      cancel_reason INT NOT NULL DEFAULT 0,
      raw_request TEXT NULL, raw_response TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY payment_order_idx (order_id),
      KEY payment_transaction_idx (provider, provider_transaction_id)
    )`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email VARCHAR(255) PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of tables) {
    await conn.query(sql);
  }

  const [colCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'users' AND column_name = 'role'`,
    [DB_NAME],
  );
  if ((colCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'`);
    console.log("Added role column to users");
  }

  const [avatarCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'users' AND column_name = 'avatar'`,
    [DB_NAME],
  );
  if ((avatarCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NOT NULL DEFAULT ''`);
    console.log("Added avatar column to users");
  }

  const [usernameCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'users' AND column_name = 'username'`,
    [DB_NAME],
  );
  if ((usernameCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE users ADD COLUMN username VARCHAR(255) NOT NULL DEFAULT ''`);
    await conn.query(`UPDATE users SET username = email WHERE username = ''`);
    console.log("Added username column to users");
  }

  const [phoneCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'contacts' AND column_name = 'phone'`,
    [DB_NAME],
  );
  if ((phoneCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE contacts ADD COLUMN phone VARCHAR(50) NOT NULL DEFAULT ''`);
    console.log("Added phone column to contacts");
  }

  const [paymentCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'orders' AND column_name = 'payment'`,
    [DB_NAME],
  );
  if ((paymentCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE orders ADD COLUMN payment VARCHAR(50) NOT NULL DEFAULT ''`);
    await conn.query(`ALTER TABLE orders ADD COLUMN delivery VARCHAR(50) NOT NULL DEFAULT ''`);
    console.log("Added payment/delivery columns to orders");
  }

  const [paymentStatusCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'orders' AND column_name = 'payment_status'`,
    [DB_NAME],
  );
  if ((paymentStatusCheck as any[])[0].c === 0) {
    await conn.query(
      `ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'`,
    );
    console.log("Added payment_status column to orders");
  }

  const [contactUserCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'contacts' AND column_name = 'user_id'`,
    [DB_NAME],
  );
  if ((contactUserCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE contacts ADD COLUMN user_id VARCHAR(36) NOT NULL DEFAULT ''`);
    console.log("Added user_id column to contacts");
  }

  const [replyCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'contacts' AND column_name = 'reply'`,
    [DB_NAME],
  );
  if ((replyCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE contacts ADD COLUMN reply TEXT`);
    console.log("Added reply column to contacts");
  }

  const [repliedAtCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'contacts' AND column_name = 'replied_at'`,
    [DB_NAME],
  );
  if ((repliedAtCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE contacts ADD COLUMN replied_at TIMESTAMP NULL DEFAULT NULL`);
    console.log("Added replied_at column to contacts");
  }

  const paymentTimeColumns: Array<[string, string]> = [
    [
      "provider_create_time",
      "ALTER TABLE payments ADD COLUMN provider_create_time BIGINT NOT NULL DEFAULT 0",
    ],
    [
      "provider_perform_time",
      "ALTER TABLE payments ADD COLUMN provider_perform_time BIGINT NOT NULL DEFAULT 0",
    ],
    [
      "provider_cancel_time",
      "ALTER TABLE payments ADD COLUMN provider_cancel_time BIGINT NOT NULL DEFAULT 0",
    ],
    ["cancel_reason", "ALTER TABLE payments ADD COLUMN cancel_reason INT NOT NULL DEFAULT 0"],
  ];
  for (const [column, sql] of paymentTimeColumns) {
    const [rows] = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'payments' AND column_name = ?`,
      [DB_NAME, column],
    );
    if ((rows as any[])[0].c === 0) {
      await conn.query(sql);
      console.log(`Added ${column} column to payments`);
    }
  }

  await conn.end();

  const db = await getDb();
  const seededProducts = await seedProductsIfEmpty(db);
  if (seededProducts > 0) {
    console.log(`Seeded ${seededProducts} products`);
  }

  console.log("Database initialized");
}

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);

const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const publicOrigin = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
const allowedOrigins = new Set(
  [
    ...configuredOrigins,
    publicOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
  ].filter(Boolean) as string[],
);
const allowedOriginPattern =
  /^https:\/\/([a-z0-9-]+\.)*(lovable\.app|lovableproject\.com|netlify\.app|onrender\.com|vercel\.app)$/i;
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use(
  cors({
    origin: (origin, callback) => {
      // Provider callbacks and server-to-server calls have no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      const isLocalDevOrigin = process.env.NODE_ENV !== "production" && localOriginPattern.test(origin);
      if (allowedOrigins.has(origin.replace(/\/+$/, "")) || allowedOriginPattern.test(origin) || isLocalDevOrigin) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Lumina backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database init failed:", err.message);
    process.exit(1);
  });