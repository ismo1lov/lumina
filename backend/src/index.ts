import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import contactRoutes from "./routes/contact.js";
import notificationRoutes from "./routes/notifications.js";
import addressRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";

const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "lumina";

async function initDatabase() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: DB_USER,
    password: DB_PASSWORD,
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
      payment VARCHAR(50) DEFAULT '', delivery VARCHAR(50) DEFAULT '',
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

  const [contactUserCheck] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'contacts' AND column_name = 'user_id'`,
    [DB_NAME],
  );
  if ((contactUserCheck as any[])[0].c === 0) {
    await conn.query(`ALTER TABLE contacts ADD COLUMN user_id VARCHAR(36) NOT NULL DEFAULT ''`);
    console.log("Added user_id column to contacts");
  }

  await conn.end();
  console.log("Database initialized");
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:4321", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

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
