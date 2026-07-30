import "dotenv/config";
import { getDb } from "./index";
import { products } from "./schema";

const productData = [
  {
    id: "nordic-walnut-lounge-chair",
    name: "Nordic Walnut Chair",
    sku: "LH-CH-0142",
    category: "Living Room",
    price: 6450000,
    material: "Solid Walnut",
    materials: ["Walnut", "Velvet"],
    colors: [{ name: "Cream Bouclé", hex: "#E6DFD5" }, { name: "Terracotta", hex: "#C86D51" }, { name: "Walnut", hex: "#3E2723" }],
    finishes: [{ name: "Walnut", delta: 0, material: "Solid Walnut", colorIndex: 0 }, { name: "Light Oak", delta: 320000, material: "Solid Oak", colorIndex: 0 }],
    rating: "4.9", reviews: 128,
    image: "/src/assets/hero-chair.jpg", altImage: "/src/assets/coffee-table/coffee.jpg",
    inStock: true, popularity: 98, createdAt: "2026-06-02", width: 78,
    description: "Hand-shaped solid walnut frame cradling a deep bouclé seat. Sculpted over 40 hours by our workshop in three passes of hand-sanding and oiling.",
  },
  {
    id: "halden-boucle-sofa",
    name: "Halden Bouclé Sofa",
    sku: "LH-SF-0233",
    category: "Living Room",
    price: 18900000,
    material: "Bouclé & Oak",
    materials: ["Oak", "Velvet"],
    colors: [{ name: "Oatmeal", hex: "#E6DFD5" }, { name: "Terracotta", hex: "#C86D51" }, { name: "Forest", hex: "#1B4332" }],
    finishes: [{ name: "Walnut", delta: 0, material: "Solid Walnut", colorIndex: 0 }, { name: "Light Oak", delta: 250000, material: "Solid Oak", colorIndex: 0 }],
    rating: "4.8", reviews: 87,
    image: "/src/assets/halden-sofa/cream.jpg", altImage: "/src/assets/halden-sofa/terracotta.jpg",
    inStock: true, popularity: 94, createdAt: "2026-05-14", width: 214,
    description: "A low, generous three-seater in soft bouclé, raised on tapered hardwood legs for a light, breathable silhouette.",
  },
  {
    id: "lumen-oak-dining-table", name: "Lumen Oak Dining Table", sku: "LH-DT-0311",
    category: "Dining Room", price: 14200000, material: "Solid Oak", materials: ["Oak"],
    colors: [{ name: "Natural Oak", hex: "#C9A87C" }, { name: "Walnut", hex: "#3E2723" }],
    finishes: [{ name: "Light Oak", delta: 0, material: "Solid Oak", colorIndex: 0 }, { name: "Walnut", delta: 400000, material: "Solid Walnut", colorIndex: 1 }],
    rating: "4.7", reviews: 64, image: "/src/assets/lumen-table/oak.jpg", altImage: "/src/assets/cat-dining.jpg",
    inStock: true, popularity: 88, createdAt: "2026-06-20", width: 180,
    description: "An oval table cut from a single oak slab, finished with plant-based oil that deepens with every shared meal.",
  },
  {
    id: "sera-slatted-sideboard", name: "Sera Slatted Sideboard", sku: "LH-SB-0177",
    category: "Dining Room", price: 11750000, material: "Walnut Veneer", materials: ["Walnut", "Oak"],
    colors: [{ name: "Walnut", hex: "#3E2723" }, { name: "Honey Oak", hex: "#C9A87C" }],
    finishes: [{ name: "Walnut", delta: 0, material: "Walnut Veneer", colorIndex: 0 }, { name: "Light Oak", delta: 180000, material: "Oak Veneer", colorIndex: 1 }],
    rating: "4.6", reviews: 41, image: "/src/assets/sideboard/sideboard-walnut.jpg", altImage: "/src/assets/cat-dining.jpg",
    inStock: false, popularity: 71, createdAt: "2026-04-08", width: 165,
    description: "Fluted slat doors on soft-close runners, with adjustable interior shelving for tableware and linens.",
  },
  {
    id: "aalto-platform-bed", name: "Aalto Platform Bed", sku: "LH-BD-0098",
    category: "Bedroom", price: 16400000, material: "Walnut & Linen", materials: ["Walnut", "Velvet"],
    colors: [{ name: "Linen", hex: "#E6DFD5" }, { name: "Clay", hex: "#C86D51" }],
    finishes: [{ name: "Walnut", delta: 0, material: "Solid Walnut", colorIndex: 0 }, { name: "Light Oak", delta: 300000, material: "Solid Oak", colorIndex: 0 }],
    rating: "4.9", reviews: 152, image: "/src/assets/aolta-bed/cream.jpg", altImage: "/src/assets/aolta-bed/terracotta.png",
    inStock: true, popularity: 96, createdAt: "2026-03-27", width: 196,
    description: "A low walnut platform with an upholstered linen headboard, engineered to sit silently for decades.",
  },
  {
    id: "kori-leather-desk-chair", name: "Kori Leather Desk Chair", sku: "LH-OC-0056",
    category: "Home Office", price: 8900000, material: "Full-grain Leather", materials: ["Leather", "Oak"],
    colors: [{ name: "Terracotta", hex: "#C86D51" }, { name: "Cream", hex: "#E6DFD5" }, { name: "Forest", hex: "#1B4332" }, { name: "Dark", hex: "#1A1A1A" }],
    finishes: [{ name: "Light Oak", delta: 0, material: "Solid Oak", colorIndex: 0 }, { name: "Walnut", delta: 220000, material: "Solid Walnut", colorIndex: 0 }],
    rating: "4.5", reviews: 33, image: "/src/assets/office-chair/terracotta-oak.jpg", altImage: "/src/assets/cat-office.jpg",
    inStock: true, popularity: 66, createdAt: "2026-07-01", width: 62,
    description: "Full-grain saddle leather over a steam-bent oak frame, on a five-star swivel base with felt-lined casters.",
  },
  {
    id: "ovi-round-coffee-table", name: "Ovi Round Coffee Table", sku: "LH-CT-0264",
    category: "Living Room", price: 5300000, material: "Solid Walnut", materials: ["Walnut"],
    colors: [{ name: "Walnut", hex: "#3E2723" }, { name: "Natural", hex: "#C9A87C" }],
    finishes: [{ name: "Walnut", delta: 0, material: "Solid Walnut", colorIndex: 0 }, { name: "Light Oak", delta: 150000, material: "Solid Oak", colorIndex: 1 }],
    rating: "4.7", reviews: 58, image: "/src/assets/coffee-table/coffee.jpg", altImage: "/src/assets/cat-living.jpg",
    inStock: true, popularity: 79, createdAt: "2026-06-28", width: 92,
    description: "A lipped walnut tray top on a tripod base — small enough for city apartments, solid enough to inherit.",
  },
  {
    id: "atlas-oak-writing-desk", name: "Atlas Oak Writing Desk", sku: "LH-DK-0201",
    category: "Home Office", price: 9800000, material: "Solid Oak", materials: ["Oak", "Walnut"],
    colors: [{ name: "Natural Oak", hex: "#C9A87C" }, { name: "Walnut", hex: "#3E2723" }],
    finishes: [{ name: "Light Oak", delta: 0, material: "Solid Oak", colorIndex: 0 }, { name: "Walnut", delta: 260000, material: "Solid Walnut", colorIndex: 1 }],
    rating: "4.8", reviews: 72, image: "/src/assets/writing-desk/desk.jpg", altImage: "/src/assets/writing-desk/desk-oak.jpg",
    inStock: true, popularity: 84, createdAt: "2026-05-30", width: 140,
    description: "A slim writing desk with a hidden cable channel and one full-width drawer in dovetailed oak.",
  },
];

const categoryImages: Record<string, string> = {
  "Living Room": "/src/assets/cat-living.jpg",
  "Bedroom": "/src/assets/cat-bedroom.jpg",
  "Dining Room": "/src/assets/cat-dining.jpg",
  "Home Office": "/src/assets/cat-office.jpg",
};

async function seed() {
  const db = await getDb();

  for (const p of productData) {
    await db
      .insert(products)
      .values(p)
      .onDuplicateKeyUpdate({ set: { name: p.name } });
  }

  console.log(`Seeded ${productData.length} products`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
