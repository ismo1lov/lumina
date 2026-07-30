import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Lumina Home — Showroom & Custom Orders" },
      {
        name: "description",
        content:
          "Visit the Lumina Home showroom in Tashkent, ask about custom dimensions, delivery or assembly, or send us a message.",
      },
      { property: "og:title", content: "Contact Lumina Home" },
      {
        property: "og:description",
        content: "Showroom details, custom order enquiries and delivery questions.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-32 lg:px-12 lg:pt-40">
      <Reveal>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 max-w-2xl font-display text-5xl lg:text-6xl">
          Come sit with the wood
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className="space-y-8">
          {[
            { icon: MapPin, title: "Showroom", copy: "24 Amir Temur Ave, Tashkent · Daily 10–20" },
            { icon: Phone, title: "Call", copy: "+998 71 200 44 10" },
            { icon: Mail, title: "Email", copy: "hello@luminahome.uz" },
          ].map((c) => (
            <div key={c.title} className="flex gap-4">
              <c.icon size={18} strokeWidth={1.5} className="mt-1 text-accent" />
              <div>
                <p className="font-display text-lg">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.copy}</p>
              </div>
            </div>
          ))}
          <div className="border-t pt-8">
            <p className="eyebrow">Custom work</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Send your room dimensions and we'll draft a piece scaled to the space, usually within
              five working days.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Name" name="name" />
              <Field label="Phone" name="phone" type="tel" />
            </div>
            <Field label="Email" name="email" type="email" />
            <label className="block">
              <span className="eyebrow">Message</span>
              <textarea
                required
                rows={5}
                className="mt-2 w-full resize-none border-b bg-transparent py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="bg-primary px-9 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Send message
            </button>
            {sent && (
              <p className="text-sm text-accent">
                Thank you — we'll reply within one working day.
              </p>
            )}
          </form>
        </Reveal>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        required
        name={name}
        type={type}
        className="mt-2 w-full border-b bg-transparent py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
