import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { useI18n } from "@/lib/i18n";

import heroChair from "@/assets/hero-chair.jpg";
import diningImg from "@/assets/cat-dining.jpg";
import deskImg from "@/assets/writing-desk/desk-oak.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Lumina Home — Small-Batch Furniture Makers" },
      {
        name: "description",
        content:
          "Since 2011 Lumina Home has hand-built hardwood furniture in Tashkent, using FSC-certified walnut and oak and plant-based finishes.",
      },
      { property: "og:title", content: "About Lumina Home" },
      {
        property: "og:description",
        content: "A small workshop making slow, warm furniture from responsibly sourced hardwood.",
      },
    ],
  }),
  component: About,
});

type Stat = {
  value: number;
  label: string;
  note: string;
  suffix?: string;
  decimals?: number;
};

const stats: Stat[] = [
  { value: 14, label: "Years of making", note: "Since 2011, one bench at a time." },
  { value: 9, label: "Craftspeople", note: "Hands that shape every joint." },
  {
    value: 40,
    label: "Average build time",
    note: "From first cut to final oil.",
  },
  { value: 4.8, decimals: 1, label: "Average rating", note: "From hundreds of verified reviews." },
];

function CountUp({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const duration = 1600;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(value * eased);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const milestones = [
  { year: "2011", text: "Two benches, one commission, a walnut table for six." },
  { year: "2014", text: "Moved to a proper workshop. Hired the first apprentice." },
  { year: "2017", text: "Began using only FSC-certified hardwoods and plant-based oils." },
  { year: "2025", text: "Nine makers, a full showroom, and still one piece at a time." },
];

const team = [
  { name: "Rustam Karimov", role: "Master Woodworker" },
  { name: "Malika Azizova", role: "Lead Designer" },
  { name: "Daler Yuldashev", role: "Finishing Specialist" },
  { name: "Zarina Sadykova", role: "Upholstery Artisan" },
];

function About() {
  const { t } = useI18n();

  return (
    <div className="bg-[#FAFAFA]">
      {/* Hero — split screen with story intro */}
      <section className="grid lg:min-h-screen lg:grid-cols-2">
        <div className="h-[50vh] overflow-hidden lg:h-auto">
          <img
            src={heroChair}
            alt="Handcrafted chair"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center px-8 py-16 lg:px-16 lg:pb-0 lg:pt-20 xl:px-24">
          <Reveal>
            <h1 className="font-display text-5xl leading-[1.05] italic lg:text-6xl xl:text-7xl">
              {t("Our Story")}
            </h1>
            <span className="mt-6 block h-px w-14 bg-accent" />
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {t(
                "A small workshop in Tashkent making slow, warm furniture from responsibly sourced hardwood.",
              )}
            </p>

            <div className="mt-10 border-t border-border/70 pt-8">
              <p className="eyebrow">{t("The beginning")}</p>
              <h2 className="mt-3 font-display text-3xl leading-tight italic lg:text-4xl">
                {t("One table at a time")}
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  {t(
                    "Lumina Home began in a two-bench workshop with a single commission: a walnut dining table for a family of six. Fourteen years later we still build in small batches, sanding through four grits, dry-fitting every joint, and finishing with a plant-based oil that lets the grain breathe.",
                  )}
                </p>
                <p>
                  {t(
                    "We source FSC-certified walnut and oak, upholster with natural bouclé and full-grain leather, and design each piece to be repaired rather than replaced.",
                  )}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Split section — stats left, desk image right */}
      <section className="grid bg-cream lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2">
        <div className="flex items-center px-8 py-16 lg:px-16 xl:px-24">
          <div className="w-full">
            <Reveal>
              <p className="eyebrow">{t("Lumina in numbers")}</p>
              <h2 className="mt-4 max-w-lg font-display text-4xl leading-tight italic xl:text-5xl">
                {t("Numbers that tell")}
                <br />
                {t("our story")}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t(
                  "Fourteen years, nine pairs of hands, and one standard: furniture worth keeping.",
                )}
              </p>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={0.1 + i * 0.08}>
                  <p className="font-sans text-5xl lg:text-6xl">
                    <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals} />
                  </p>
                  <p className="mt-2 text-sm tracking-wide text-muted-foreground">{t(s.label)}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">
                    {t(s.note)}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
        <div className="relative h-[50vh] overflow-hidden lg:h-auto">
          <img
            src={deskImg}
            alt="Atlas oak writing desk"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Timeline — full-bleed images with year overlays */}
      <section className="py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal>
            <p className="eyebrow">{t("Our journey")}</p>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl">{t("Milestones")}</h2>
          </Reveal>
        </div>

        <div className="mt-16 flex justify-center gap-0 overflow-x-auto px-6 pb-8 lg:px-12">
          {milestones.map((m, i) => (
            <Reveal key={m.year} delay={i * 0.06} className="flex-shrink-0 snap-start">
              <div className="w-[260px] lg:w-[300px]">
                <p className="font-display text-2xl italic">{m.year}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(m.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Full-bleed image team section */}
      <section className="relative h-[75vh]">
        <img
          src={diningImg}
          alt="Lumina Home workshop interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-16 lg:px-12">
          <Reveal>
            <p className="text-sm tracking-[0.15em] uppercase text-white/60">{t("Meet the makers")}</p>
            <h2 className="mt-2 font-display text-4xl italic text-white lg:text-5xl">
              {t("The hands behind the wood")}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={i * 0.07}>
                <p className="font-display text-lg text-white">{member.name}</p>
                <p className="text-sm text-white/60">{t(member.role)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA section */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-cream">
        <div className="relative z-10 px-6 text-center">
          <Reveal>
            <p className="font-display text-4xl italic leading-tight text-foreground lg:text-6xl">
              {t("Every piece, signed by the maker who built it.")}
            </p>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(
                "Nothing leaves the workshop until it is signed. We deliver across Uzbekistan, assemble in your home, and stand behind the joinery for two full years.",
              )}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
