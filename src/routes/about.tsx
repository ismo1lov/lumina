import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/site/Reveal";

import diningImg from "@/assets/cat-dining.jpg";
import livingImg from "@/assets/cat-living.jpg";
import heroChair from "@/assets/hero-chair.jpg";
import bedroomImg from "@/assets/cat-bedroom.jpg";
import officeImg from "@/assets/cat-office.jpg";

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

const stats = [
  { value: "14", label: "Years of making" },
  { value: "9", label: "Craftspeople" },
  { value: "40h", label: "Average build time" },
  { value: "4.8", label: "Average rating" },
];

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
  return (
    <div className="bg-[#FAFAFA]">
      {/* Hero — full-screen image with overlay */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <img
          src={diningImg}
          alt="Lumina Home dining furniture"
          className="absolute inset-0 h-full w-full object-cover brightness-125"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 px-6 text-center text-white">
          <Reveal>
            <p className="tracking-[0.15em] text-sm uppercase" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>Since 2011</p>
            <h1 className="mt-6 font-display text-6xl leading-tight italic lg:text-[7rem]" style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              Our Story
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/80" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              A small workshop in Tashkent making slow, warm furniture from responsibly sourced
              hardwood.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Split screen — image left, text right */}
      <section className="grid lg:grid-cols-2">
        <div className="h-[50vh] overflow-hidden lg:h-auto">
          <img
            src={heroChair}
            alt="Handcrafted chair"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex items-center px-8 py-16 lg:px-16">
          <Reveal>
            <p className="eyebrow">The beginning</p>
            <h2 className="mt-4 font-display text-4xl leading-tight italic lg:text-5xl">
              One table at a time
            </h2>
            <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Lumina Home began in a two-bench workshop with a single commission: a walnut dining
                table for a family of six. Fourteen years later we still build in small batches,
                sanding through four grits, dry-fitting every joint, and finishing with a plant-based
                oil that lets the grain breathe.
              </p>
              <p>
                We source FSC-certified walnut and oak, upholster with natural bouclé and full-grain
                leather, and design each piece to be repaired rather than replaced.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Full-bleed parallax section */}
      <section className="relative flex h-[50vh] items-center justify-center bg-fixed bg-cover bg-center" style={{ backgroundImage: `url(${livingImg})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 grid max-w-5xl gap-8 px-6 text-white sm:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center">
              <p className="font-display text-5xl lg:text-6xl">{s.value}</p>
              <p className="mt-2 text-sm tracking-wide text-white/70">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Timeline — full-bleed images with year overlays */}
      <section className="py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal>
            <p className="eyebrow">Our journey</p>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl">Milestones</h2>
          </Reveal>
        </div>

        <div className="mt-16 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-8 lg:px-12">
          {milestones.map((m, i) => (
            <Reveal key={m.year} delay={i * 0.06} className="relative flex-shrink-0 snap-start">
              <div className="flex h-[420px] w-[340px] flex-col justify-end overflow-hidden rounded-xl bg-[#2A2A2A] p-8 text-white lg:w-[400px]">
                <p className="font-display text-7xl italic opacity-20">{m.year}</p>
                <p className="relative mt-4 text-lg leading-relaxed">{m.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Full-bleed image team section */}
      <section className="relative h-screen">
        <img
          src={bedroomImg}
          alt="Lumina Home workshop interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-16 lg:px-12">
          <Reveal>
            <p className="text-sm tracking-[0.15em] uppercase text-white/60">Meet the makers</p>
            <h2 className="mt-2 font-display text-4xl italic text-white lg:text-5xl">
              The hands behind the wood
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={i * 0.07}>
                <p className="font-display text-lg text-white">{member.name}</p>
                <p className="text-sm text-white/60">{member.role}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA section */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
        <img
          src={officeImg}
          alt="Lumina Home office"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 px-6 text-center text-white">
          <Reveal>
            <p className="font-display text-4xl italic leading-tight lg:text-6xl">
              Every piece, signed by the maker who built it.
            </p>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/70">
              Nothing leaves the workshop until it is signed. We deliver across Uzbekistan, assemble
              in your home, and stand behind the joinery for two full years.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
