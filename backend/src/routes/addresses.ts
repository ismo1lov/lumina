import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { addresses } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, req.userId!))
      .orderBy(addresses.isDefault);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = z
      .object({
        label: z.string().default("Home"),
        fullName: z.string().min(2),
        phone: z.string().min(7),
        address: z.string().min(5),
        city: z.string().min(2),
        zip: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        isDefault: z.boolean().default(false),
      })
      .parse(req.body);

    const db = await getDb();

    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, req.userId!));
    }

    await db.insert(addresses).values({
      id: crypto.randomUUID(),
      userId: req.userId!,
      label: data.label,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      zip: data.zip || "",
      lat: data.lat?.toString() || null,
      lng: data.lng?.toString() || null,
      isDefault: data.isDefault,
    });

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

router.put("/:id", async (req, res) => {
  try {
    const data = z
      .object({
        label: z.string().optional(),
        fullName: z.string().min(2).optional(),
        phone: z.string().min(7).optional(),
        address: z.string().min(5).optional(),
        city: z.string().min(2).optional(),
        zip: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        isDefault: z.boolean().optional(),
      })
      .parse(req.body);

    const db = await getDb();

    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, req.userId!));
    }

    const updateData: Record<string, unknown> = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.zip !== undefined) updateData.zip = data.zip;
    if (data.lat !== undefined) updateData.lat = data.lat.toString();
    if (data.lng !== undefined) updateData.lng = data.lng.toString();
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    await db
      .update(addresses)
      .set(updateData)
      .where(eq(addresses.id, req.params.id));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = await getDb();
    await db.delete(addresses).where(eq(addresses.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
