import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { wishlistItems, products } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const items = await db
      .select({
        id: wishlistItems.id,
        productId: wishlistItems.productId,
        name: products.name,
        image: products.image,
        price: products.price,
      })
      .from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, req.userId!));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/toggle", async (req, res) => {
  try {
    const { productId } = z.object({ productId: z.string() }).parse(req.body);
    const db = await getDb();

    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, req.userId!), eq(wishlistItems.productId, productId)))
      .limit(1);

    if (existing) {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
      res.json({ added: false });
    } else {
      await db.insert(wishlistItems).values({
        id: randomUUID(),
        userId: req.userId!,
        productId,
      });
      res.json({ added: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
