import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import heroChair from "@/assets/hero-chair.jpg";

interface LoginResponse {
  user: { id: string; name: string; email: string; role: string };
  token: string;
}

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin Login — Lumina" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLoginPage,
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function AdminLoginPage() {
  const { t } = useI18n();
  const { user, loading, setAuth } = useAuth();
  const navigate = useNavigate();
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user?.role === "admin") return <Navigate to="/admin" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api.post<LoginResponse>("/auth/admin-login", { login: loginName, password });
      if (result.user.role !== "admin") {
        setError(t("This account does not have admin access"));
        return;
      }
      setAuth(result.user, result.token);
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
      {/* Brown glow on the light background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_16%_6%,rgba(150,102,70,0.16),transparent_62%),radial-gradient(55%_50%_at_84%_90%,rgba(150,102,70,0.16),transparent_60%)]" />
      <motion.div
        animate={{ x: [0, 36, 0], y: [0, 24, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-40 -top-40 size-[460px] rounded-full bg-walnut/10 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[55%] top-[-20%] size-[380px] rounded-full bg-accent/15 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -24, 0], y: [0, 32, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[-8%] top-[45%] size-[340px] rounded-full bg-walnut/8 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 36, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-44 -right-32 size-[520px] rounded-full bg-accent/10 blur-3xl"
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_40px_90px_-40px_rgba(38,27,20,0.4)] lg:min-h-[540px] lg:grid-cols-[1.05fr_1fr]"
      >
        <motion.div
          variants={rise}
          className="relative hidden flex-col justify-between overflow-hidden bg-walnut lg:flex"
        >
          {/* Full-bleed image fills the whole panel */}
          <motion.img
            src={heroChair}
            alt="Lumina lounge chair"
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-walnut/85 via-walnut/45 to-walnut/25" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-walnut/55 to-transparent" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-cream/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative p-10">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="" className="size-9" />
              <p className="font-display text-3xl text-cream">
                Lumina<span className="text-accent">Admin</span>
              </p>
            </div>
          </div>

          <div className="relative p-10">
            <p className="font-display text-lg leading-snug text-cream">
              {t("Crafting warmth for modern homes.")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-cream/60">
              {t("Orders, customers and messages — all in one place.")}
            </p>
          </div>
        </motion.div>

        <motion.div variants={rise} className="flex flex-col p-8 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <h1 className="font-display text-3xl">{t("Welcome back")}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("Sign in to manage your store")}</p>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 items-center py-8">
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Login")}
                </label>
                <div className="group relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-300 group-focus-within:text-walnut"
                  />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-300 focus:border-walnut focus:bg-white focus:ring-4 focus:ring-walnut/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Password")}
                </label>
                <div className="group relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-300 group-focus-within:text-walnut"
                  />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/50 py-3.5 pl-11 pr-11 text-sm outline-none transition-all duration-300 focus:border-walnut focus:bg-white focus:ring-4 focus:ring-walnut/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-walnut"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key={error}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-600"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={busy}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-walnut py-4 text-[11px] uppercase tracking-[0.25em] text-cream shadow-[0_18px_35px_-18px_rgba(38,27,20,0.55)] transition-shadow duration-300 hover:shadow-[0_22px_40px_-18px_rgba(38,27,20,0.6)] disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-cream/30 border-t-cream" />
                    {t("Signing in...")}
                  </>
                ) : (
                  <>
                    {t("Sign in to dashboard")}
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          <div className="mx-auto w-full max-w-md">
            <p className="text-center">
              <Link
                to="/"
                className="text-xs text-muted-foreground transition-colors hover:text-walnut"
              >
                {t("← Back to Lumina store")}
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
