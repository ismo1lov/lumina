import sofaCream from "@/assets/halden-sofa/cream.jpg";
import sofaTerracotta from "@/assets/halden-sofa/terracotta.jpg";
import sofaForrest from "@/assets/halden-sofa/forrest.jpg";
import sofaCreamOak from "@/assets/halden-sofa/cream-oak.jpg";
import sofaTerracottaOak from "@/assets/halden-sofa/terracotta-oak.jpg";
import sofaForrestOak from "@/assets/halden-sofa/forrest-oak.jpg";
import tableOak from "@/assets/lumen-table/oak.jpg";
import tableWalnut from "@/assets/lumen-table/walnut.jpg";
import sideboardOak from "@/assets/sideboard/sideboard-oak.jpg";
import sideboardWalnut from "@/assets/sideboard/sideboard-walnut.jpg";
import chairTerracottaOak from "@/assets/office-chair/terracotta-oak.jpg";
import chairCreamOak from "@/assets/office-chair/cream-oak.jpg";
import chairForrestOak from "@/assets/office-chair/forrest-oak.jpg";
import chairDarkOak from "@/assets/office-chair/dark-oak.jpg";
import chairTerracottaWalnut from "@/assets/office-chair/terracotta-walnut.jpg";
import chairCreamWalnut from "@/assets/office-chair/cream-walnut.jpg";
import chairForrestWalnut from "@/assets/office-chair/forrest-walnut.jpg";
import chairDarkWalnut from "@/assets/office-chair/dark-walnut.jpg";
import coffee from "@/assets/coffee-table/coffee.jpg";
import coffeeOak from "@/assets/coffee-table/coffee-oak.jpg";
import hero from "@/assets/hero-chair.jpg";
import living from "@/assets/cat-living.jpg";
import bedroomCat from "@/assets/cat-bedroom.jpg";
import desk from "@/assets/writing-desk/desk.jpg";
import deskOak from "@/assets/writing-desk/desk-oak.jpg";
import dining from "@/assets/cat-dining.jpg";
import officeRoom from "@/assets/cat-office.jpg";
import creamChair from "@/assets/nordic-chair/cream.png";
import terracottaChair from "@/assets/nordic-chair/terracotta.png";
import walnutChair from "@/assets/nordic-chair/walnut.png";
import creamOak from "@/assets/nordic-chair/cream-oak.png";
import terracottaOak from "@/assets/nordic-chair/terracotta-oak.png";
import walnutOak from "@/assets/nordic-chair/walnut-oak.png";
import bedLinen from "@/assets/aolta-bed/cream.jpg";
import bedClay from "@/assets/aolta-bed/terracotta.png";
import bedLinenOak from "@/assets/aolta-bed/cream-oak.jpg";
import bedClayOak from "@/assets/aolta-bed/terracotta-oak.jpg";

export const categoryImages = {
  "Living Room": living,
  Bedroom: bedroomCat,
  "Dining Room": dining,
  "Home Office": officeRoom,
} as const;

export type Category = keyof typeof categoryImages;

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: Category;
  price: number;
  material: string;
  materials: string[];
  colors: { name: string; hex: string; image?: string }[];
  finishes: { name: string; delta: number; colorImages?: string[]; material: string; colorIndex: number }[];
  rating: number;
  reviews: number;
  image: string;
  altImage: string;
  inStock: boolean;
  popularity: number;
  createdAt: string;
  width: number;
  dimensions: { width: number; height: number; depth: number };
  description: string;
}

export const products: Product[] = [
  {
    id: "nordic-walnut-lounge-chair",
    name: "Nordic Walnut Chair",
    sku: "LH-CH-0142",
    category: "Living Room",
    price: 6450000,
    material: "Solid Walnut",
    materials: ["Walnut", "Velvet"],
    colors: [
      { name: "Cream Bouclé", hex: "#E6DFD5", image: creamChair },
      { name: "Terracotta", hex: "#C86D51", image: terracottaChair },
      { name: "Walnut", hex: "#3E2723", image: walnutChair },
    ],
    finishes: [
      { name: "Walnut", delta: 0, colorImages: [creamChair, terracottaChair, walnutChair], material: "Solid Walnut", colorIndex: 0 },
      { name: "Light Oak", delta: 320000, colorImages: [creamOak, terracottaOak, walnutOak], material: "Solid Oak", colorIndex: 0 },
    ],
    rating: 4.9,
    reviews: 128,
    image: hero,
    altImage: coffee,
    inStock: true,
    popularity: 98,
    createdAt: "2026-06-02",
    width: 78,
    dimensions: { width: 78, height: 82, depth: 84 },
    description:
      "Hand-shaped solid walnut frame cradling a deep bouclé seat. Sculpted over 40 hours by our workshop in three passes of hand-sanding and oiling.",
  },
  {
    id: "halden-boucle-sofa",
    name: "Halden Bouclé Sofa",
    sku: "LH-SF-0233",
    category: "Living Room",
    price: 18900000,
    material: "Bouclé & Oak",
    materials: ["Oak", "Velvet"],
    colors: [
      { name: "Oatmeal", hex: "#E6DFD5", image: sofaCream },
      { name: "Terracotta", hex: "#C86D51", image: sofaTerracotta },
      { name: "Forest", hex: "#1B4332", image: sofaForrest },
    ],
    finishes: [
      { name: "Walnut", delta: 0, colorImages: [sofaCream, sofaTerracotta, sofaForrest], material: "Solid Walnut", colorIndex: 0 },
      { name: "Light Oak", delta: 250000, colorImages: [sofaCreamOak, sofaTerracottaOak, sofaForrestOak], material: "Solid Oak", colorIndex: 0 },
    ],
    rating: 4.8,
    reviews: 87,
    image: sofaCream,
    altImage: sofaTerracotta,
    inStock: true,
    popularity: 94,
    createdAt: "2026-05-14",
    width: 214,
    dimensions: { width: 214, height: 78, depth: 92 },
    description:
      "A low, generous three-seater in soft bouclé, raised on tapered hardwood legs for a light, breathable silhouette.",
  },
  {
    id: "lumen-oak-dining-table",
    name: "Lumen Oak Dining Table",
    sku: "LH-DT-0311",
    category: "Dining Room",
    price: 14200000,
    material: "Solid Oak",
    materials: ["Oak"],
    colors: [
      { name: "Natural Oak", hex: "#C9A87C", image: tableOak },
      { name: "Walnut", hex: "#3E2723", image: tableWalnut },
    ],
    finishes: [
      { name: "Light Oak", delta: 0, colorImages: [tableOak, tableWalnut], material: "Solid Oak", colorIndex: 0 },
      { name: "Walnut", delta: 400000, colorImages: [tableOak, tableWalnut], material: "Solid Walnut", colorIndex: 1 },
    ],
    rating: 4.7,
    reviews: 64,
    image: tableOak,
    altImage: dining,
    inStock: true,
    popularity: 88,
    createdAt: "2026-06-20",
    width: 180,
    dimensions: { width: 180, height: 75, depth: 96 },
    description:
      "An oval table cut from a single oak slab, finished with plant-based oil that deepens with every shared meal.",
  },
  {
    id: "sera-slatted-sideboard",
    name: "Sera Slatted Sideboard",
    sku: "LH-SB-0177",
    category: "Dining Room",
    price: 11750000,
    material: "Walnut Veneer",
    materials: ["Walnut", "Oak"],
    colors: [
      { name: "Walnut", hex: "#3E2723", image: sideboardWalnut },
      { name: "Honey Oak", hex: "#C9A87C", image: sideboardOak },
    ],
    finishes: [
      { name: "Walnut", delta: 0, colorImages: [sideboardWalnut, sideboardOak], material: "Walnut Veneer", colorIndex: 0 },
      { name: "Light Oak", delta: 180000, colorImages: [sideboardWalnut, sideboardOak], material: "Oak Veneer", colorIndex: 1 },
    ],
    rating: 4.6,
    reviews: 41,
    image: sideboardWalnut,
    altImage: dining,
    inStock: false,
    popularity: 71,
    createdAt: "2026-04-08",
    width: 165,
    dimensions: { width: 165, height: 72, depth: 45 },
    description:
      "Fluted slat doors on soft-close runners, with adjustable interior shelving for tableware and linens.",
  },
  {
    id: "aalto-platform-bed",
    name: "Aalto Platform Bed",
    sku: "LH-BD-0098",
    category: "Bedroom",
    price: 16400000,
    material: "Walnut & Linen",
    materials: ["Walnut", "Velvet"],
    colors: [
      { name: "Linen", hex: "#E6DFD5", image: bedLinen },
      { name: "Clay", hex: "#C86D51", image: bedClay },
    ],
    finishes: [
      { name: "Walnut", delta: 0, colorImages: [bedLinen, bedClay], material: "Solid Walnut", colorIndex: 0 },
      { name: "Light Oak", delta: 300000, colorImages: [bedLinenOak, bedClayOak], material: "Solid Oak", colorIndex: 0 },
    ],
    rating: 4.9,
    reviews: 152,
    image: bedLinen,
    altImage: bedClay,
    inStock: true,
    popularity: 96,
    createdAt: "2026-03-27",
    width: 196,
    dimensions: { width: 196, height: 95, depth: 214 },
    description:
      "A low walnut platform with an upholstered linen headboard, engineered to sit silently for decades.",
  },
  {
    id: "kori-leather-desk-chair",
    name: "Kori Leather Desk Chair",
    sku: "LH-OC-0056",
    category: "Home Office",
    price: 8900000,
    material: "Full-grain Leather",
    materials: ["Leather", "Oak"],
    colors: [
      { name: "Terracotta", hex: "#C86D51", image: chairTerracottaOak },
      { name: "Cream", hex: "#E6DFD5", image: chairCreamOak },
      { name: "Forest", hex: "#1B4332", image: chairForrestOak },
      { name: "Dark", hex: "#1A1A1A", image: chairDarkOak },
    ],
    finishes: [
      { name: "Light Oak", delta: 0, colorImages: [chairTerracottaOak, chairCreamOak, chairForrestOak, chairDarkOak], material: "Solid Oak", colorIndex: 0 },
      { name: "Walnut", delta: 220000, colorImages: [chairTerracottaWalnut, chairCreamWalnut, chairForrestWalnut, chairDarkWalnut], material: "Solid Walnut", colorIndex: 0 },
    ],
    rating: 4.5,
    reviews: 33,
    image: chairTerracottaOak,
    altImage: officeRoom,
    inStock: true,
    popularity: 66,
    createdAt: "2026-07-01",
    width: 62,
    dimensions: { width: 62, height: 96, depth: 60 },
    description:
      "Full-grain saddle leather over a steam-bent oak frame, on a five-star swivel base with felt-lined casters.",
  },
  {
    id: "ovi-round-coffee-table",
    name: "Ovi Round Coffee Table",
    sku: "LH-CT-0264",
    category: "Living Room",
    price: 5300000,
    material: "Solid Walnut",
    materials: ["Walnut"],
    colors: [
      { name: "Walnut", hex: "#3E2723", image: coffee },
      { name: "Natural", hex: "#C9A87C", image: coffeeOak },
    ],
    finishes: [
      { name: "Walnut", delta: 0, colorImages: [coffee, coffeeOak], material: "Solid Walnut", colorIndex: 0 },
      { name: "Light Oak", delta: 150000, colorImages: [coffee, coffeeOak], material: "Solid Oak", colorIndex: 1 },
    ],
    rating: 4.7,
    reviews: 58,
    image: coffee,
    altImage: living,
    inStock: true,
    popularity: 79,
    createdAt: "2026-06-28",
    width: 92,
    dimensions: { width: 92, height: 38, depth: 92 },
    description:
      "A lipped walnut tray top on a tripod base — small enough for city apartments, solid enough to inherit.",
  },
  {
    id: "atlas-oak-writing-desk",
    name: "Atlas Oak Writing Desk",
    sku: "LH-DK-0201",
    category: "Home Office",
    price: 9800000,
    material: "Solid Oak",
    materials: ["Oak", "Walnut"],
    colors: [
      { name: "Natural Oak", hex: "#C9A87C", image: desk },
      { name: "Walnut", hex: "#3E2723", image: desk },
    ],
    finishes: [
      { name: "Light Oak", delta: 0, colorImages: [deskOak, desk], material: "Solid Oak", colorIndex: 0 },
      { name: "Walnut", delta: 260000, colorImages: [deskOak, desk], material: "Solid Walnut", colorIndex: 1 },
    ],
    rating: 4.8,
    reviews: 72,
    image: deskOak,
    altImage: desk,
    inStock: true,
    popularity: 84,
    createdAt: "2026-05-30",
    width: 140,
    dimensions: { width: 140, height: 75, depth: 62 },
    description:
      "A slim writing desk with a hidden cable channel and one full-width drawer in dovetailed oak.",
  },
];

export const ASSEMBLY_FEE = 150000;

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function formatUZS(value: number) {
  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} UZS`;
}
