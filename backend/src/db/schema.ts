import {
  mysqlTable,
  varchar,
  int,
  decimal,
  boolean,
  text,
  json,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).notNull().default(""),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    avatar: varchar("avatar", { length: 500 }).notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("email_idx").on(table.email),
  }),
);

export const products = mysqlTable("products", {
  id: varchar("id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  price: int("price").notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  materials: json("materials").$type<string[]>().notNull(),
  colors: json("colors").$type<{ name: string; hex: string; image?: string }[]>().notNull(),
  finishes: json("finishes")
    .$type<
      { name: string; delta: number; colorImages?: string[]; material: string; colorIndex: number }[]
    >()
    .notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  reviews: int("reviews").notNull(),
  image: varchar("image", { length: 500 }).notNull(),
  altImage: varchar("alt_image", { length: 500 }).notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  popularity: int("popularity").notNull().default(0),
  createdAt: varchar("created_at", { length: 20 }).notNull(),
  width: int("width").notNull(),
  description: text("description").notNull(),
});

export const cartItems = mysqlTable(
  "cart_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    productId: varchar("product_id", { length: 100 }).notNull(),
    finish: varchar("finish", { length: 100 }).notNull().default(""),
    color: varchar("color", { length: 100 }).notNull().default(""),
    assembly: boolean("assembly").notNull().default(false),
    qty: int("qty").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userProductIdx: uniqueIndex("cart_user_product_idx").on(table.userId, table.productId, table.finish, table.color, table.assembly),
  }),
);

export const wishlistItems = mysqlTable(
  "wishlist_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    productId: varchar("product_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userProductIdx: uniqueIndex("wl_user_product_idx").on(table.userId, table.productId),
  }),
);

export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    subtotal: int("subtotal").notNull(),
    total: int("total").notNull(),
    shippingAddress: json("shipping_address").$type<{
      name: string;
      phone: string;
      address: string;
      city: string;
      zip?: string;
      lat?: string;
      lng?: string;
    }>(),
    payment: varchar("payment", { length: 50 }).notNull().default(""),
    delivery: varchar("delivery", { length: 50 }).notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("order_user_id_idx").on(table.userId),
  }),
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    orderId: varchar("order_id", { length: 36 }).notNull(),
    productId: varchar("product_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    finish: varchar("finish", { length: 100 }).notNull().default(""),
    color: varchar("color", { length: 100 }).notNull().default(""),
    assembly: boolean("assembly").notNull().default(false),
    unitPrice: int("unit_price").notNull(),
    qty: int("qty").notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_id_idx").on(table.orderId),
  }),
);

export const addresses = mysqlTable("addresses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  label: varchar("label", { length: 100 }).notNull().default("Home"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  zip: varchar("zip", { length: 20 }).default(""),
  lat: varchar("lat", { length: 50 }),
  lng: varchar("lng", { length: 50 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const contacts = mysqlTable("contacts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().default(""),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull().default(""),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = mysqlTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notif_user_idx").on(table.userId),
  }),
);
