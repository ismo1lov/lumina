import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatUZS, type Product } from "@/data/products";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { Stars } from "./Stars";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { resolveAsset } from "@/lib/assets";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const wished = has(product.id);
  const [open, setOpen] = useState(false);
  const productImage = resolveAsset(product.image);

  return (
    <>
      <article className="group flex flex-col" onClick={() => setOpen(true)}>
        <div className="relative overflow-hidden bg-cream">
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            aria-label={product.name}
            onClick={(e) => e.stopPropagation()}
            className="block cursor-pointer"
          >
            <img
              src={productImage}
              alt={product.name}
              loading="lazy"
              width={1000}
              height={1000}
              className="aspect-square w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          </Link>
        <span className="absolute left-4 top-4 bg-background/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          {product.material}
        </span>
        {!product.inStock && (
          <span className="absolute right-4 top-4 bg-accent px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent-foreground">
            Pre-order
          </span>
        )}
        <button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            toggle({ id: product.id, name: product.name, image: productImage!, price: product.price });
          }}
          className="absolute right-4 bottom-4 grid size-9 place-items-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 hover:text-accent"
        >
          <Heart size={15} className={wished ? "fill-accent text-accent" : ""} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <div className="flex items-start justify-between gap-4">
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="font-display text-lg leading-snug link-underline"
            onClick={(e) => e.stopPropagation()}
          >
            {product.name}
          </Link>
          <span className="whitespace-nowrap pt-1 text-sm">{formatUZS(product.price)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Stars rating={product.rating} />
          <span>
            {product.rating} · {product.reviews} reviews
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            add({
              id: product.id,
              name: product.name,
              image: productImage!,
              finish: product.finishes[0].name,
              color: product.colors[0].name,
              assembly: false,
              unitPrice: product.price,
              qty: 1,
            });
          }}
          className="mt-3 w-full border border-foreground/20 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
        >
          Add to cart
        </button>
      </div>
    </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{product.name}</DialogTitle>
            <DialogDescription className="text-sm">{product.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 sm:grid-cols-2">
            <img
              src={productImage}
              alt={product.name}
              width={400}
              height={400}
              className="w-full bg-cream object-cover"
            />
            <div className="flex flex-col gap-4">
              <p className="font-semibold tabular-nums text-xl">{formatUZS(product.price)}</p>
              <p className="text-xs text-muted-foreground">{product.material}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Stars rating={product.rating} />
                <span>{product.rating} · {product.reviews} reviews</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{product.description}</p>
              <Link
                to="/product/$id"
                params={{ id: product.id }}
                className="mt-auto text-center border border-foreground/20 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => setOpen(false)}
              >
                View full details
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
