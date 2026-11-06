import "dotenv/config";
import { getDb } from "./index.js";
import { productData, seedProductsIfEmpty } from "./productSeed.js";

async function seed() {
  const db = await getDb();
  const inserted = await seedProductsIfEmpty(db);
  if (inserted > 0) {
    console.log(`Seeded ${inserted} products`);
  } else {
    console.log(`Products already present (${productData.length} in catalog), nothing to seed`);
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
