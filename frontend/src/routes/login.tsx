import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff } from "lucide-react";
import heroChair from "@/assets/hero-chair.jpg";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

const registerImage = "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80";

function PwInput({ value, onChange, required, minLength }: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-input bg-transparent px-3 py-2 pr-10 text-sm outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-primary cursor-pointer bg-transparent border-none"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>): { mode?: string; token?: string; error?: string } => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
    token: typeof search.token === "string" ? search.token : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({
    links: [
      { rel: "preload", href: heroChair, as: "image" },
      { rel: "preload", href: registerImage, as: "image" },
    ],
  }),
});

function AuthPage() {
  const { t } = useI18n();
  const { mode, token, error: googleError } = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const isRegister = mode === "register";
  const toggle = () => navigate({ to: "/login", search: { mode: isRegister ? "login" : "register" } });
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overscrollBehaviorX = "none";
    return () => { document.body.style.overscrollBehaviorX = ""; };
  }, []);

  // Google OAuth callback redirects back here with a short-lived token.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        localStorage.setItem("lumina-token", token);
        const user = await api.get<{
          id: string;
          name: string;
          email: string;
          username?: string;
          role: string;
          avatar?: string;
        }>("/auth/me");
        if (cancelled) return;
        setAuth(user, token);
        navigate({ to: "/" });
      } catch {
        if (!cancelled) navigate({ to: "/login", search: { mode } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, mode, navigate, setAuth]);

  useEffect(() => {
    if (googleError) setError(t("Google sign-in failed"));
  }, [googleError, t]);

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute right-6 top-6 z-20 rounded-full bg-background/80 px-3 py-2 backdrop-blur">
        <LanguageSwitcher />
      </div>
      <div className="flex w-full lg:flex-row flex-col">
        {/* Image panel */}
        <div className="relative h-[calc(40vh/var(--ui-scale))] w-full overflow-hidden bg-[#f5f0eb] md:h-[calc(46vh/var(--ui-scale))] lg:h-screen lg:w-1/2">
          <motion.img
            animate={{ x: isRegister ? "-25%" : "0%" }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            src={heroChair}
            alt="Interior"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <AnimatePresence initial={false}>
            {isRegister && (
              <motion.img
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                src={registerImage}
                alt="Interior"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute top-8 left-8">
            <p className="font-display text-3xl">
              <span className="text-[#5C3A21]">Lumina Home</span>
              <span className="text-[#E85D1F]">.</span>
            </p>
          </div>
          <div className="absolute bottom-10 left-10 text-white max-w-md text-left">
            <motion.div
              animate={{ opacity: isRegister ? 0 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <p className="font-display text-[38px] font-[500] leading-tight tracking-[0.02em] md:text-[40px] lg:text-[44px]">
                {t("Bringing Warmth to Every Home")}
              </p>
              <p className="text-base opacity-90 mt-3 leading-relaxed">
                {t(
                  "Handcrafted hardwood furniture for modern sanctuaries — sofas, beds, dining tables and more.",
                )}
              </p>
            </motion.div>
            <motion.div
              animate={{ opacity: isRegister ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0 }}
            >
              <p className="font-display text-[38px] font-[500] leading-tight tracking-[0.02em] md:text-[40px] lg:text-[44px]">
                {t("Join the Lumina Family")}
              </p>
              <p className="text-base opacity-90 mt-3 leading-relaxed">
                {t("Create your account and explore our handcrafted collection.")}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-10 md:py-16 lg:px-6 lg:py-12">
          <div className="w-full max-w-md">
            {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
            <AnimatePresence mode="wait">
              <motion.div
                key={isRegister ? "register-form" : "login-form"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {isRegister ? <RegisterForm onToggle={toggle} /> : <LoginForm onToggle={toggle} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function GoogleSignInButton({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const label = mode === "register" ? t("Sign up with Google") : t("Sign in with Google");
  return (
    <div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.15em]">
          <span className="bg-background px-2 text-muted-foreground">{t("Or")}</span>
        </div>
      </div>
      <a
        href={`${API_BASE}/api/auth/google`}
        className="mt-4 w-full flex items-center justify-center gap-3 rounded-md border border-input bg-background py-3 text-sm font-medium text-foreground transition-colors hover:border-[#E85D1F] hover:text-[#E85D1F]"
      >
        <GoogleIcon />
        {label}
      </a>
    </div>
  );
}

function LoginForm({ onToggle }: { onToggle: () => void }) {
  const { t } = useI18n();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.post<{ user: { id: string; name: string; email: string; role: string }; token: string }>(
        "/auth/login", { email, password }
      );
      if (result.user.role === "admin") {
        setError(t("Admin accounts cannot sign in here"));
        return;
      }
      setAuth(result.user, result.token);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-3xl text-center mb-1">{t("Sign In")}</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">{t("Welcome back to Lumina")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">{t("Email")}</label>
          <input type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">{t("Password")}</label>
          <PwInput value={password} onChange={setPassword} required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <GoogleSignInButton mode="login" />
        <button type="submit" disabled={loading} className="w-full bg-primary py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
          {loading ? t("Signing in...") : t("Sign In")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("Don't have an account?")}{" "}
        <button onClick={onToggle} className="underline underline-offset-4 hover:text-primary cursor-pointer bg-transparent border-none p-0 text-sm">
          {t("Create one")}
        </button>
      </p>
    </>
  );
}

function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const { t } = useI18n();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.post<{ user: { id: string; name: string; email: string; role: string }; token: string }>(
        "/auth/register", { name, email, password }
      );
      if (result.user.role === "admin") {
        setError(t("Admin accounts cannot be created here"));
        return;
      }
      setAuth(result.user, result.token);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-3xl text-center mb-1">{t("Create Account")}</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">{t("Join the Lumina family")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">{t("Name")}</label>
          <input type="text" required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">{t("Email")}</label>
          <input type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">{t("Password")}</label>
          <PwInput value={password} onChange={setPassword} required minLength={6} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <GoogleSignInButton mode="register" />
        <button type="submit" disabled={loading} className="w-full bg-primary py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
          {loading ? t("Creating account...") : t("Create Account")}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("Already have an account?")}{" "}
        <button onClick={onToggle} className="underline underline-offset-4 hover:text-primary cursor-pointer bg-transparent border-none p-0 text-sm">
          {t("Sign in")}
        </button>
      </p>
    </>
  );
}
