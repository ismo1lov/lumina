import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowDown, ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import heroChair from "@/assets/hero-chair.jpg";
import { categoryImages, products, type Category } from "@/data/products";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumina Home" },
      {
        name: "description",
        content:
          "Hand-crafted walnut and oak furniture from Lumina Home. Sofas, beds, dining tables and desks made in small batches, delivered and assembled.",
      },
      { property: "og:title", content: "Lumina Home" },
      {
        property: "og:description",
        content: "Warm, minimalist hardwood furniture for modern sanctuaries.",
      },
    ],
  }),
  component: Home,
});

const categories: Category[] = ["Living Room", "Bedroom", "Dining Room", "Home Office"];

const faqs = [
  {
    question: "How long does delivery take?",
    answer:
      "Delivery and assembly across Uzbekistan take 7–14 days. Every order is fully covered by free delivery.",
  },
  {
    question: "Are the dimensions really custom?",
    answer:
      "Yes — every dining table, desk or bed is made to your room measurements and assembled at home.",
  },
  {
    question: "What wood do you use?",
    answer: "Solid walnut and oak, FSC-certified, finished with hand-applied natural oils.",
  },
  {
    question: "How long does the warranty last?",
    answer: "Two years covering joinery and the hand-finished surfaces.",
  },
  {
    question: "How do I care for my furniture?",
    answer:
      "Dust with a soft dry cloth, avoid harsh chemicals, and re-apply natural oil once a year.",
  },
];

function Home() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const bestSellers = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden bg-cream pt-24 md:pt-20">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 md:grid-cols-[1fr_0.92fr] md:gap-8 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.h1
              className="mt-6 font-display text-[2.75rem] leading-[1.05] sm:text-5xl md:text-[2.7rem] lg:text-[4.2rem]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              {t("Crafted Comfort for Your Modern Sanctuary")}
            </motion.h1>
            <motion.p
              className="mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              {t(
                "Cozy, hand-finished furniture shaped from solid walnut and oak. Each piece is oiled by hand, built to soften with time, and delivered ready to live in.",
              )}
            </motion.p>
            <motion.div
              className="mt-10 flex max-w-[420px] flex-col items-stretch gap-3 min-[451px]:max-w-none md:max-w-[260px] lg:mt-10 lg:max-w-none lg:flex-row lg:flex-wrap lg:items-center lg:gap-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <Link
                to="/catalog"
                className="group inline-flex items-center justify-center gap-3 bg-primary px-8 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90 md:px-6 md:py-3.5 md:text-[10px] md:tracking-[0.18em] lg:px-8 lg:py-4 lg:text-[11px] lg:tracking-[0.22em]"
              >
                {t("Explore Collection")}
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-3 border border-foreground/25 px-8 py-4 text-[11px] uppercase tracking-[0.22em] transition-colors hover:border-foreground md:px-6 md:py-3.5 md:text-[10px] md:tracking-[0.18em] lg:px-8 lg:py-4 lg:text-[11px] lg:tracking-[0.22em]"
              >
                {t("Contact Us")}
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative mx-auto max-w-[300px] float-slow min-[451px]:max-w-[440px] md:max-w-[340px] lg:max-w-[420px]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-x-6 bottom-4 top-12 rounded-full bg-sand/60 blur-3xl" />
            <img
              src={heroChair}
              alt="Nordic walnut lounge chair with cream bouclé cushions"
              width={600}
              height={700}
              className="relative w-full object-contain"
            />
            <div className="absolute bottom-4 left-4 hidden bg-background/90 px-5 py-4 backdrop-blur sm:block">
              <p className="eyebrow">{t("Featured")}</p>
              <p className="mt-1 font-display text-base">{t("Nordic Walnut Chair")}</p>
              <Link
                to="/product/$id"
                params={{ id: "nordic-walnut-lounge-chair" }}
                className="mt-1 inline-block text-[11px] uppercase tracking-[0.2em] text-accent link-underline"
              >
                {t("View piece")}
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:bottom-6 md:block lg:bottom-8"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-[10px] uppercase tracking-[0.22em]">{t("Scroll")}</span>
            <ArrowDown size={14} />
          </span>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-8 md:py-24 lg:px-12 lg:py-32">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">{t("Browse by room")}</p>
            <h2 className="mt-4 max-w-lg font-display text-4xl md:text-[2.6rem] lg:text-5xl">
              {t("Rooms that breathe, pieces that stay")}
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-[11px] uppercase tracking-[0.2em] link-underline"
          >
            {t("All categories")}
          </Link>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 md:mt-14 md:gap-6 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Reveal key={cat} delay={i * 0.08}>
              <Link
                to="/catalog"
                search={{ category: cat }}
                className="group block overflow-hidden bg-cream"
                aria-label={t("Shop {category}", { category: t(cat) })}
              >
                <div className="overflow-hidden">
                  <img
                    src={categoryImages[cat]}
                    alt={t("{category} furniture", { category: t(cat) })}
                    loading="lazy"
                    width={900}
                    height={1100}
                    className="aspect-[3/4] w-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                  />
                </div>
                <div className="flex items-center justify-between px-5 py-5">
                  <span className="font-display text-xl">{t(cat)}</span>
                  <ArrowRight
                    size={15}
                    className="text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="bg-cream py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-8 lg:px-12">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">{t("Best sellers")}</p>
              <h2 className="mt-4 font-display text-4xl md:text-[2.6rem] lg:text-5xl">
                {t("Loved in many homes")}
              </h2>
            </div>
            <Link to="/catalog" className="text-[11px] uppercase tracking-[0.2em] link-underline">
              {t("Shop all")}
            </Link>
          </Reveal>

          <div className="relative mt-12 md:mt-14">
            <button
              type="button"
              aria-label={t("Scroll left")}
              onClick={() => {
                const el = document.getElementById("bestsellers-scroll")!;
                el.scrollBy({ left: -372, behavior: "smooth" });
              }}
              className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer rounded-full border bg-background/90 p-2.5 shadow-sm backdrop-blur transition-colors hover:bg-background md:block"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label={t("Scroll right")}
              onClick={() => {
                const el = document.getElementById("bestsellers-scroll")!;
                el.scrollBy({ left: 372, behavior: "smooth" });
              }}
              className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 cursor-pointer rounded-full border bg-background/90 p-2.5 shadow-sm backdrop-blur transition-colors hover:bg-background md:block"
            >
              <ChevronRight size={18} />
            </button>
            <div
              id="bestsellers-scroll"
              className="flex gap-8 overflow-x-auto pb-6 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {bestSellers.map((p, i) => (
                <Reveal
                  key={p.id}
                  delay={i * 0.05}
                  className="w-[78vw] shrink-0 sm:w-[340px] md:w-[320px] lg:w-[340px]"
                >
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-8 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t("FAQ")}</p>
            <h2 className="mt-4 font-display text-4xl md:text-[2.6rem] lg:text-5xl">
              {t("Questions, answered simply")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
              {t(
                "Everything you might want to know before making your first piece part of the home.",
              )}
            </p>
          </Reveal>

          <div className="mx-auto mt-14 max-w-3xl">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.question} className="border-b border-border/70 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-display text-lg text-foreground lg:text-xl">
                      {t(faq.question)}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted-foreground transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="max-w-xl pb-6 text-sm leading-relaxed text-muted-foreground">
                      {t(faq.answer)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
