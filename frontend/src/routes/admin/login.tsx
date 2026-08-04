import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
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
  const { user, loading, setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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
      const result = await api.post<LoginResponse>("/auth/login", { email, password });
      if (result.user.role !== "admin") {
        setError("This account does not have admin access");
        return;
      }
      setAuth(result.user, result.token);
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
      <motion.div
        animate={{ x: [0, 36, 0], y: [0, 24, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-40 -top-40 size-[460px] rounded-full bg-sand/70 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[55%] top-[-20%] size-[380px] rounded-full bg-accent/15 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -24, 0], y: [0, 32, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[-8%] top-[45%] size-[340px] rounded-full bg-sand/50 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 36, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-44 -right-32 size-[520px] rounded-full bg-accent/10 blur-3xl"
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute right-[12%] top-[14%] hidden size-24 rounded-full border border-walnut/10 lg:block"
      />
      <motion.div
        animate={{ y: [0, -16, 0], rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute left-[8%] top-[18%] hidden size-10 rounded-full border border-walnut/20 lg:block"
      />
      <motion.div
        animate={{ y: [0, 18, 0], rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute bottom-[16%] left-[14%] hidden size-16 rounded-full border border-walnut/10 lg:block"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 10, 0], rotate: 360 }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute right-[26%] bottom-[22%] hidden size-8 rounded-full border border-walnut/20 lg:block"
      />
      <motion.div
        animate={{ y: [0, -12, 0], rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute right-[6%] top-[38%] hidden size-6 rounded-full border border-walnut/15 lg:block"
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_40px_90px_-40px_rgba(38,27,20,0.4)] lg:grid-cols-[1fr_1.15fr]"
      >
        <motion.div
          variants={rise}
          className="relative hidden flex-col justify-between overflow-hidden bg-walnut p-10 lg:flex"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-cream/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-accent/25 blur-3xl" />

          <div className="relative">
            <p className="font-display text-3xl text-cream">
              Lumina<span className="text-accent">.</span>
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-cream/90 ring-1 ring-cream/20">
              <ShieldCheck size={12} />
              Admin Panel
            </span>
          </div>

          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, -1.5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto w-56"
          >
            <div className="absolute inset-4 rounded-full bg-cream/10 blur-xl" />
            <div className="relative overflow-hidden rounded-2xl bg-cream p-3 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)]">
              <img
                src={heroChair}
                alt="Lumina chair"
                className="aspect-square w-full object-cover"
              />
            </div>
          </motion.div>

          <div className="relative">
            <p className="font-display text-lg leading-snug text-cream">
              Crafting warmth for modern homes.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-cream/60">
              Orders, customers and messages — all in one place.
            </p>
          </div>
        </motion.div>

        <motion.div variants={rise} className="p-8 sm:p-12">
          <div className="mx-auto max-w-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-walnut">
              <ShieldCheck size={12} />
              Admin Access
            </span>

            <h1 className="mt-5 font-display text-3xl">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to manage your store</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Login
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/50 py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-300 focus:border-walnut focus:bg-white focus:ring-4 focus:ring-walnut/10"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground/70">
                  Your login name or email
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Password
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
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </motion.button>
            </form>

            <p className="mt-8 text-center">
              <Link
                to="/"
                className="text-xs text-muted-foreground transition-colors hover:text-walnut"
              >
                ← Back to Lumina store
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
