import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import heroChair from "@/assets/hero-chair.jpg";

const registerImage = "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80";

export const Route = createFileRoute("/login")({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) || "login",
  }),
  head: () => ({
    links: [
      { rel: "preload", href: heroChair, as: "image" },
      { rel: "preload", href: registerImage, as: "image" },
    ],
  }),
});

function AuthPage() {
  const { mode } = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const toggle = () => navigate({ to: "/login", search: { mode: isRegister ? "login" : "register" } });

  useEffect(() => {
    document.body.style.overscrollBehaviorX = "none";
    return () => { document.body.style.overscrollBehaviorX = ""; };
  }, []);

  return (
    <div className="flex min-h-screen overflow-hidden">
      <div className="flex w-full lg:flex-row flex-col">
        {/* Image panel */}
        <div className="relative lg:w-1/2 h-[40vh] lg:h-screen overflow-hidden bg-[#f5f0eb]">
          <motion.img
            animate={{ opacity: isRegister ? 0 : 1, scale: isRegister ? 1.15 : 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            src={heroChair}
            alt="Interior"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <motion.img
            animate={{ opacity: isRegister ? 1 : 0, scale: isRegister ? 1 : 1.15 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            src={registerImage}
            alt="Interior"
            className="absolute inset-0 w-full h-full object-cover"
          />
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
              <p className="font-display text-[44px] font-[500] tracking-[0.02em] leading-tight">Bringing Warmth to<br />Every Home</p>
              <p className="text-base opacity-90 mt-3 leading-relaxed">Handcrafted hardwood furniture for modern sanctuaries — sofas, beds, dining tables and more.</p>
            </motion.div>
            <motion.div
              animate={{ opacity: isRegister ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0 }}
            >
              <p className="font-display text-[44px] font-[500] tracking-[0.02em] leading-tight">Join the<br />Lumina Family</p>
              <p className="text-base opacity-90 mt-3 leading-relaxed">Create your account and explore our handcrafted collection.</p>
            </motion.div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
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

function LoginForm({ onToggle }: { onToggle: () => void }) {
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
      const result = await api.post<{ user: { id: string; name: string; email: string }; token: string }>(
        "/auth/login", { email, password }
      );
      setAuth(result.user, result.token);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-3xl text-center mb-1">Sign In</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">Welcome back to Lumina</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-primary py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={onToggle} className="underline underline-offset-4 hover:text-primary cursor-pointer bg-transparent border-none p-0 text-sm">
          Create one
        </button>
      </p>
    </>
  );
}

function RegisterForm({ onToggle }: { onToggle: () => void }) {
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
      const result = await api.post<{ user: { id: string; name: string; email: string }; token: string }>(
        "/auth/register", { name, email, password }
      );
      setAuth(result.user, result.token);
      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="font-display text-3xl text-center mb-1">Create Account</h1>
      <p className="text-sm text-muted-foreground text-center mb-8">Join the Lumina family</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Name</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-primary py-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={onToggle} className="underline underline-offset-4 hover:text-primary cursor-pointer bg-transparent border-none p-0 text-sm">
          Sign in
        </button>
      </p>
    </>
  );
}
