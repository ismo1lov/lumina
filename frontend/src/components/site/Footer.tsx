import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const contactLinks = [
  {
    href: "tel:+998977318666",
    label: "Call us",
    title: "+998 97 731 86 66",
    Icon: Phone,
  },
  {
    href: "mailto:ismoilovabdulloh2009@gmail.com",
    label: "Email us",
    title: "ismoilovabdulloh2009@gmail.com",
    Icon: Mail,
  },
  {
    href: "https://www.google.com/maps/search/?api=1&query=Tashkent%2C+Uzbekistan",
    label: "Find us on Google Maps",
    title: "Tashkent, Uzbekistan",
    Icon: MapPin,
    external: true,
  },
];

export function Footer() {
  const { t } = useI18n();

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
            <p className="eyebrow text-primary-foreground/50">{t("Contact")}</p>
            <p className="mt-5 text-sm text-primary-foreground/70">
              {t("Questions about a piece? Call us, write, or visit our showroom in Tashkent.")}
            </p>
            <div className="mt-5 flex items-center gap-3">
              {contactLinks.map(({ href, label, title, Icon, external }) => (
                <a
                  key={href}
                  href={href}
                  aria-label={t(label)}
                  title={title}
                  {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="grid size-11 place-items-center text-primary-foreground/80 transition-colors hover:text-accent"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
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
