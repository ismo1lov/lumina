import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { orders, orderItems, cartItems, products } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { shippingAddress } = z
      .object({
        shippingAddress: z.object({
          name: z.string(),
          phone: z.string(),
          address: z.string(),
          city: z.string(),
          zip: z.string().optional(),
        }),
      })
      .parse(req.body);

    const db = await getDb();
    const cart = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        finish: cartItems.finish,
        color: cartItems.color,
        assembly: cartItems.assembly,
        qty: cartItems.qty,
        name: products.name,
        price: products.price,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, req.userId!));

    if (cart.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.qty * (item.price ?? 0), 0);
    const orderId = crypto.randomUUID();

    await db.insert(orders).values({
      id: orderId,
      userId: req.userId!,
      subtotal,
      total: subtotal,
      shippingAddress,
    });

    for (const item of cart) {
      await db.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId,
        productId: item.productId,
        name: item.name ?? "",
        finish: item.finish,
        color: item.color,
        assembly: item.assembly,
        unitPrice: item.price ?? 0,
        qty: item.qty,
      });
    }

    await db.delete(cartItems).where(eq(cartItems.userId, req.userId!));
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
    res.json(result);
  } catch (err) {
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
