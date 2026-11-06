import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { orders, orderItems, payments, products } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  ASSEMBLY_FEE,
  DELIVERY_FEES,
  getPaymentConfig,
  providerCheckoutUrl,
} from "../lib/payments.js";

const router = Router();
router.use(authMiddleware);

const PAYMENT_METHODS = ["cod", "click", "payme"] as const;
const DELIVERY_METHODS = ["standard", "express"] as const;

router.post("/", async (req, res) => {
  try {
    const { shippingAddress, payment, delivery, items } = z
      .object({
        shippingAddress: z.object({
          name: z.string().min(1),
          phone: z.string().min(1),
          address: z.string().min(1),
          city: z.string().min(1),
          lat: z.string().optional(),
          lng: z.string().optional(),
        }),
        payment: z.enum(PAYMENT_METHODS),
        delivery: z.enum(DELIVERY_METHODS),
        items: z
          .array(
            z.object({
              productId: z.string(),
              finish: z.string().default(""),
              color: z.string().default(""),
              assembly: z.boolean(),
              qty: z.number().int().min(1).max(20),
            }),
          )
          .min(1),
      })
      .parse(req.body);

    const config = getPaymentConfig();
    if (payment === "payme" && !config.payme) {
      res.status(400).json({ error: "Payme is not configured yet" });
      return;
    }
    if (payment === "click" && !config.click) {
      res.status(400).json({ error: "Click is not configured yet" });
      return;
    }

    const db = await getDb();
    const productIds = [...new Set(items.map((i) => i.productId))];
    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        colors: products.colors,
        finishes: products.finishes,
      })
      .from(products)
      .where(inArray(products.id, productIds));
    const byId = new Map(productRows.map((p) => [p.id, p]));

    if (productRows.length !== productIds.length) {
      res.status(400).json({ error: "Invalid product in order" });
      return;
    }

    const rows = items.map((item) => {
      const product = byId.get(item.productId)!;
      const finish =
        product.finishes.find((f) => f.name === item.finish) ??
        (item.finish === "" ? product.finishes[0] : undefined);
      if (!finish) {
        throw new Error(`Invalid finish selected for ${product.name}`);
      }
      const color =
        product.colors.find((c) => c.name === item.color) ??
        (item.color === "" ? product.colors[0] : undefined);
      if (!color) {
        throw new Error(`Invalid colour selected for ${product.name}`);
      }

      const unitPrice =
        product.price + (finish.delta ?? 0) + (item.assembly ? ASSEMBLY_FEE : 0);

      return { ...item, product, finish, color, unitPrice };
    });

    const subtotal = rows.reduce((sum, row) => sum + row.unitPrice * row.qty, 0);
    const deliveryFee = DELIVERY_FEES[delivery] ?? 0;
    const total = subtotal + deliveryFee;
    const orderId = randomUUID();
    const redirectUrl =
      payment === "cod" ? null : providerCheckoutUrl(payment, orderId, total);

    if (payment !== "cod" && !redirectUrl) {
      res.status(400).json({ error: "This payment method is not configured yet" });
      return;
    }

    await db.transaction(async (tx: any) => {
      await tx.insert(orders).values({
        id: orderId,
        userId: req.userId!,
        subtotal,
        total,
        shippingAddress,
        payment,
        paymentStatus: payment === "cod" ? "unpaid" : "pending",
        delivery,
      });

      await tx.insert(orderItems).values(
        rows.map((row) => ({
          id: randomUUID(),
          orderId,
          productId: row.product.id,
          name: row.product.name,
          finish: row.finish.name,
          color: row.color.name,
          assembly: row.assembly,
          unitPrice: row.unitPrice,
          qty: row.qty,
        })),
      );

      if (payment !== "cod") {
        await tx.insert(payments).values({
          id: randomUUID(),
          orderId,
          userId: req.userId!,
          provider: payment,
          amount: total,
          state: "created",
          providerCreateTime: Date.now(),
          rawRequest: JSON.stringify({ source: "checkout" }),
        });
      }
    });

    res.json({ orderId, redirectUrl: redirectUrl ?? undefined });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    if (err instanceof Error && err.message.startsWith("Invalid ")) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.userId!))
      .orderBy(desc(orders.createdAt));

    const orderIds = result.map((order) => order.id);
    const allItems = orderIds.length
      ? await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            name: orderItems.name,
            finish: orderItems.finish,
            color: orderItems.color,
            assembly: orderItems.assembly,
            unitPrice: orderItems.unitPrice,
            qty: orderItems.qty,
            image: products.image,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(inArray(orderItems.orderId, orderIds))
      : [];

    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    res.json(result.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const db = await getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, req.params.id), eq(orders.userId, req.userId!)))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (!["pending", "confirmed"].includes(order.status)) {
      res.status(400).json({ error: "Order can no longer be cancelled" });
      return;
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
      res.status(400).json({
        error: "Paid orders cannot be cancelled online. Please contact us to arrange a refund.",
      });
      return;
    }

    await db
      .update(orders)
      .set({
        status: "cancelled",
        paymentStatus: order.payment === "cod" ? "unpaid" : "cancelled",
      })
      .where(eq(orders.id, order.id));
    await db
      .update(payments)
      .set({ state: "cancelled", providerCancelTime: Date.now() })
      .where(and(eq(payments.orderId, order.id), eq(payments.state, "created")));

    res.json({ success: true, status: "cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, req.params.id), eq(orders.userId, req.userId!)))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
