import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatUzPhone, isValidUzPhone } from "@/lib/phone";
import { useI18n } from "@/lib/i18n";
import contactImage from "@/assets/contact-image.jpg";

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
  const { t } = useI18n();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phoneInvalid, setPhoneInvalid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhoneInvalid(false);
    if (!isValidUzPhone(phone2)) {
      setPhoneInvalid(true);
      setError(t("Please enter a complete and valid phone number (+998 ** *** ** **)"));
      return;
    }
    setBusy(true);
    try {
      await api.post("/contact", {
        name,
        email: user ? undefined : email,
        phone: phone2,
        subject: company || undefined,
        message,
      });
      setName("");
      setPhone2("");
      setEmail("");
      setCompany("");
      setMessage("");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Failed to send"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-12 lg:px-12 lg:pt-24 lg:pb-32">
        <section className="grid gap-12 lg:grid-cols-2 lg:gap-24 lg:items-start lg:pt-24">
          {/* Left — image with small bottom-left overlay text */}
          <div className="relative w-full h-[420px] lg:h-[520px] overflow-hidden bg-cream">
            <img
              src={contactImage}
              alt="Handcrafted furniture in the Lumina Home workshop"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-6 left-6 z-10 text-white">
              <h2 className="font-display text-3xl lg:text-4xl">{t("Contact")}</h2>
              <p className="mt-1 text-sm font-medium">{t("Biz bilan bog‘laning")}</p>
            </div>
          </div>

          {/* Right — form */}
          <div className="h-full flex flex-col justify-between">
            <h2 className="font-display text-4xl leading-tight lg:text-5xl">{t("Get in Touch")}</h2>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Full Name" name="name" value={name} onChange={setName} />
                <Field
                  label="Telefon raqam"
                  name="phone2"
                  type="tel"
                  value={phone2}
                  onChange={(v) => setPhone2(formatUzPhone(v))}
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Company" name="company" value={company} onChange={setCompany} />
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
              </div>
              <label className="block">
                <span className="eyebrow">{t("Message")}</span>
                <textarea
                  required
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 w-full resize-none border-b bg-transparent py-2 text-sm outline-none focus:border-accent"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="cursor-pointer w-full bg-primary px-9 py-4 text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? t("Sending…") : t("Send message")}
              </button>
              {sent && (
                <p className="text-sm text-accent">
                  {t("Thank you — we'll reply within one working day.")}
                </p>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const { t } = useI18n();
  return (
    <label className="block">
      <span className="eyebrow">{t(label)}</span>
      <input
        required={required}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b bg-transparent py-2 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
