import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

export function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/newsletter", { email });
      setSent(true);
      setEmail("");
    } catch (err) {
      setSent(false);
      setError(
        err instanceof Error
          ? t(err.message)
          : t("Newsletter subscription failed. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          <div>
            <p className="font-display text-3xl">
              Lumina<span className="text-accent">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/70">
              {t(
                "Hand-crafted furniture for modern sanctuaries. Made slowly, in small batches, from responsibly sourced hardwood.",
              )}
            </p>
          </div>

          <div>
            <p className="eyebrow text-primary-foreground/50">{t("Shop")}</p>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              <li>
                <Link to="/catalog" className="link-underline">
                  {t("All furniture")}
                </Link>
              </li>
              <li>
                <Link to="/categories" className="link-underline">
                  {t("Categories")}
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="link-underline">
                  {t("New arrivals")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-primary-foreground/50">{t("Company")}</p>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              <li>
                <Link to="/about" className="link-underline">
                  {t("About us")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  {t("Contact")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  {t("Delivery & returns")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-primary-foreground/50">{t("Newsletter")}</p>
            <p className="mt-5 text-sm text-primary-foreground/70">
              {t("Notes on craft, new pieces, and studio openings. Once a month.")}
            </p>
            <form
              className="mt-5 flex items-center border-b border-primary-foreground/30"
              onSubmit={subscribe}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Your email")}
                disabled={busy}
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-primary-foreground/40 disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label={t("Subscribe")}
                disabled={busy}
                className="p-2 hover:text-accent disabled:opacity-50"
              >
                <ArrowRight size={16} className={busy ? "animate-pulse" : ""} />
              </button>
            </form>
            {sent && (
              <p className="mt-2 text-xs text-accent">{t("Thank you — you're on the list.")}</p>
            )}
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-primary-foreground/15 pt-8 sm:flex-row">
          <p className="text-xs text-primary-foreground/50">
            {t("© {year} Lumina Home. Tashkent, Uzbekistan.", {
              year: new Date().getFullYear(),
            })}
          </p>
        </div>
      </div>
    </footer>
  );
}
