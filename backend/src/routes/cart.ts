import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { cartItems, products } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        finish: cartItems.finish,
        color: cartItems.color,
        assembly: cartItems.assembly,
        qty: cartItems.qty,
        name: products.name,
        image: products.image,
        price: products.price,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, req.userId!));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { productId, finish, color, assembly, qty } = z
      .object({
        productId: z.string(),
        finish: z.string(),
        color: z.string(),
        assembly: z.boolean(),
        qty: z.number().int().min(1),
      })
      .parse(req.body);

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, req.userId!),
          eq(cartItems.productId, productId),
          eq(cartItems.finish, finish),
          eq(cartItems.color, color),
          eq(cartItems.assembly, assembly),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(cartItems)
        .set({ qty: existing.qty + qty })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        id: randomUUID(),
        userId: req.userId!,
        productId,
        finish,
        color,
        assembly,
        qty,
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

router.post("/update", async (req, res) => {
  try {
    const { id, qty } = z
      .object({ id: z.string(), qty: z.number().int().min(0) })
      .parse(req.body);

    const db = await getDb();
    if (qty <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, id));
    } else {
      await db.update(cartItems).set({ qty }).where(eq(cartItems.id, id));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/remove", async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.body);
    const db = await getDb();
    await db.delete(cartItems).where(eq(cartItems.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/clear", async (req, res) => {
  try {
    const db = await getDb();
    await db.delete(cartItems).where(eq(cartItems.userId, req.userId!));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
