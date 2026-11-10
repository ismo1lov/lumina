import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { reviews, products, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

/** Real rating summary for every product that has at least one review. */
router.get("/summary/all", async (_req, res) => {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        productId: reviews.productId,
        average: sql<number>`CAST(AVG(${reviews.rating}) AS DECIMAL(2,1))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .groupBy(reviews.productId);

    res.json(
      rows.map((r) => ({
        productId: r.productId,
        average: Number(r.average ?? 0),
        count: Number(r.count ?? 0),
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** All reviews of a product + the real aggregate (average + count). */
router.get("/:productId", async (req, res) => {
  try {
    const productId = String(req.params.productId);
    const db = await getDb();

    const items = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        userName: reviews.userName,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(100);

    const [summary] = await db
      .select({
        average: sql<number>`CAST(AVG(${reviews.rating}) AS DECIMAL(2,1))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    res.json({
      items,
      average: Number(summary?.average ?? 0),
      count: Number(summary?.count ?? 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** The review of the logged-in user for this product (or null). */
router.get("/:productId/mine", authMiddleware, async (req, res) => {
  try {
    const productId = String(req.params.productId);
    const db = await getDb();

    const [mine] = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, req.userId!)))
      .limit(1);

    res.json(mine ?? null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Create or update the review of the logged-in user for this product. */
router.post("/:productId", authMiddleware, async (req, res) => {
  try {
    const productId = String(req.params.productId);
    const body = z
      .object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional().default(""),
      })
      .parse(req.body);

    const db = await getDb();

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [profile] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);

    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, req.userId!)))
      .limit(1);

    if (existing) {
      await db
        .update(reviews)
        .set({ rating: body.rating, comment: body.comment })
        .where(eq(reviews.id, existing.id));
    } else {
      await db.insert(reviews).values({
        id: randomUUID(),
        productId,
        userId: req.userId!,
        userName: profile?.name ?? "",
        rating: body.rating,
        comment: body.comment,
      });
    }

    // Keep the product aggregate in sync with the real reviews.
    const [summary] = await db
      .select({
        average: sql<number>`CAST(AVG(${reviews.rating}) AS DECIMAL(2,1))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const average = Number(summary?.average ?? 0);
    const count = Number(summary?.count ?? 0);

    await db
      .update(products)
      .set({ rating: String(average), reviews: count })
      .where(eq(products.id, productId));

    res.json({ ok: true, average, count });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid rating" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
