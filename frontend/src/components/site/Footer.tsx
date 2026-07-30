import { Link } from "@tanstack/react-router";
import { ArrowRight, Instagram, Facebook, Youtube } from "lucide-react";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          <div>
            <p className="font-display text-3xl">
              Lumina<span className="text-accent">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/70">
              Hand-crafted furniture for modern sanctuaries. Made slowly, in small batches, from
              responsibly sourced hardwood.
            </p>
            <div className="mt-6 flex gap-4">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid size-9 place-items-center rounded-full border border-primary-foreground/25 transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow text-primary-foreground/50">Shop</p>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              <li>
                <Link to="/catalog" className="link-underline">
                  All furniture
                </Link>
              </li>
              <li>
                <Link to="/categories" className="link-underline">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="link-underline">
                  New arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-primary-foreground/50">Company</p>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              <li>
                <Link to="/about" className="link-underline">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  Delivery &amp; returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-primary-foreground/50">Newsletter</p>
            <p className="mt-5 text-sm text-primary-foreground/70">
              Notes on craft, new pieces, and studio openings. Once a month.
            </p>
            <form
              className="mt-5 flex items-center border-b border-primary-foreground/30"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
                setEmail("");
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-primary-foreground/40"
              />
              <button type="submit" aria-label="Subscribe" className="p-2 hover:text-accent">
                <ArrowRight size={16} />
              </button>
            </form>
            {sent && <p className="mt-2 text-xs text-accent">Thank you — you're on the list.</p>}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-primary-foreground/15 pt-8 sm:flex-row">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Lumina Home. Tashkent, Uzbekistan.
          </p>
          <div className="flex items-center gap-3">
            {["Click", "Payme", "Visa"].map((p) => (
              <span
                key={p}
                className="rounded-sm border border-primary-foreground/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-primary-foreground/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
