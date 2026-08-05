import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, desc, inArray } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { orders, orderItems, products } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const DELIVERY_FEES: Record<string, number> = { standard: 0, express: 250000 };

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
        payment: z.string().min(1),
        delivery: z.string().min(1),
        items: z
          .array(
            z.object({
              productId: z.string(),
              finish: z.string(),
              color: z.string(),
              assembly: z.boolean(),
              qty: z.number().int().min(1),
            }),
          )
          .min(1),
      })
      .parse(req.body);

    const db = await getDb();
    const productIds = [...new Set(items.map((i) => i.productId))];
    const productRows = await db
      .select({ id: products.id, name: products.name, price: products.price })
      .from(products)
      .where(inArray(products.id, productIds));
    const byId = new Map(productRows.map((p) => [p.id, p]));

    const rows = items.map((i) => ({ ...i, product: byId.get(i.productId) }));
    if (rows.some((r) => !r.product)) {
      res.status(400).json({ error: "Invalid product in order" });
      return;
    }

    const subtotal = rows.reduce((sum, r) => sum + r.qty * (r.product!.price ?? 0), 0);
    const fee = DELIVERY_FEES[delivery] ?? 0;
    const orderId = randomUUID();

    await db.insert(orders).values({
      id: orderId,
      userId: req.userId!,
      subtotal,
      total: subtotal + fee,
      shippingAddress,
      payment,
      delivery,
    });

    for (const r of rows) {
      await db.insert(orderItems).values({
        id: randomUUID(),
        orderId,
        productId: r.productId,
        name: r.product!.name,
        finish: r.finish,
        color: r.color,
        assembly: r.assembly,
        unitPrice: r.product!.price,
        qty: r.qty,
      });
    }

    res.json({ orderId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
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

    const allItems = await db
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
      .leftJoin(products, eq(orderItems.productId, products.id));

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
      .where(eq(orders.id, req.params.id))
      .limit(1);
    if (!order || order.userId !== req.userId) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (!["pending", "confirmed"].includes(order.status)) {
      res.status(400).json({ error: "Order can no longer be cancelled" });
      return;
    }

    await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, req.params.id));
    res.json({ success: true, status: "cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, req.params.id));

    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
