import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AdminShell, avatarUrl } from "@/components/admin/AdminShell";
import { Camera, Eye, EyeOff, KeyRound, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileResponse {
  user: { id: string; name: string; email: string; username?: string; role: string; avatar: string };
}

function PwField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 pr-11 text-sm outline-none transition-all duration-300 focus:border-walnut focus:bg-white focus:ring-4 focus:ring-walnut/10"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-walnut"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lumina Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading, setAuth } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setMsg({ type: "err", text: "Image too large (max 2MB)" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  const saveProfile = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const body: { name: string; username?: string; avatar?: string } = { name, username };
      if (avatar && avatar.startsWith("data:")) body.avatar = avatar;
      const res = await api.patch<ProfileResponse>("/admin/profile", body);
      const token = localStorage.getItem("lumina-token");
      if (token) setAuth(res.user, token);
      setMsg({ type: "ok", text: "Profile updated successfully" });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setMsg(null);
    if (next !== conf) {
      setMsg({ type: "err", text: "New passwords do not match" });
      return;
    }
    setPwBusy(true);
    try {
      await api.patch("/admin/password", { currentPassword: cur, newPassword: next });
      setCur("");
      setNext("");
      setConf("");
      setMsg({ type: "ok", text: "Password changed successfully" });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed to change password" });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <AdminShell active="settings">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your admin profile — all changes are saved to the database.
        </p>
      </motion.div>

      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.text}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm ${
              msg.type === "ok"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {msg.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3 }}
          className="rounded-3xl border border-border bg-white/80 p-7 shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]"
        >
          <h2 className="font-display text-lg">Profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">Name, login and profile photo</p>

          <div className="mt-6 flex items-center gap-5">
            <div className="relative">
              {avatarUrl(avatar) ? (
                <img
                  src={avatarUrl(avatar)!}
                  alt={name}
                  className="size-20 rounded-2xl object-cover ring-2 ring-cream"
                />
              ) : (
                <span className="grid size-20 place-items-center rounded-2xl bg-walnut font-display text-2xl text-cream">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <label className="absolute -bottom-2 -right-2 grid size-9 cursor-pointer place-items-center rounded-full bg-walnut text-cream shadow-lg transition-transform hover:scale-110">
                <Camera size={14} />
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
              </label>
            </div>
            <div>
              <p className="font-display">{user.name}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Admin account</p>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-walnut focus:bg-white focus:ring-4 focus:ring-walnut/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Login
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm outline-none transition-all duration-300 focus:border-walnut focus:bg-white focus:ring-4 focus:ring-walnut/10"
              />
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Letters, numbers, dots, dashes and underscores
              </p>
            </div>
          </div>

          <motion.button
            onClick={saveProfile}
            disabled={saving}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-walnut py-3.5 text-[11px] uppercase tracking-[0.25em] text-cream shadow-[0_18px_35px_-18px_rgba(38,27,20,0.55)] transition-shadow hover:shadow-[0_22px_40px_-18px_rgba(38,27,20,0.6)] disabled:opacity-60"
          >
            {saving ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-cream/30 border-t-cream" />
            ) : (
              <>
                <Save size={14} />
                Save profile
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3 }}
          className="rounded-3xl border border-border bg-white/80 p-7 shadow-[0_10px_28px_-24px_rgba(38,27,20,0.3)]"
        >
          <h2 className="font-display text-lg">Password</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Change your admin password. Saved to the database — you stay signed in.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Current password
              </label>
              <PwField value={cur} onChange={setCur} />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                New password
              </label>
              <PwField value={next} onChange={setNext} />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Confirm new password
              </label>
              <PwField value={conf} onChange={setConf} />
            </div>
          </div>

          <motion.button
            onClick={savePassword}
            disabled={pwBusy}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-walnut/25 bg-walnut/5 py-3.5 text-[11px] uppercase tracking-[0.25em] text-walnut transition-colors hover:bg-walnut hover:text-cream disabled:opacity-60"
          >
            {pwBusy ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-walnut/30 border-t-walnut" />
            ) : (
              <>
                <KeyRound size={14} />
                Change password
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </AdminShell>
  );
}
