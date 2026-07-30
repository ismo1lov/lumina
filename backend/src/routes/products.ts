import { Router } from "express";
import { eq, desc, asc } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { products } from "../db/schema.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const db = await getDb();
    const result = await db.select().from(products);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .select({ category: products.category })
      .from(products)
      .groupBy(products.category)
      .orderBy(products.category);
    res.json(result.map((r) => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const db = await getDb();
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
