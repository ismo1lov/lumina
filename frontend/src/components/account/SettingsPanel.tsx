import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Check, Languages, Lock, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth, type User } from "@/lib/auth-context";
import { useI18n, type Lang } from "@/lib/i18n";
import { useConfirm } from "@/lib/use-confirm";
import { SectionHeading } from "@/components/account/SectionHeading";
import { AddressBook } from "@/components/account/AddressBook";
import { UserAvatar } from "@/components/account/UserAvatar";

const cardClass = "border border-border/80 bg-card p-5 sm:p-6";

function SectionHeader({
  icon: Icon,
  title,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid size-9 shrink-0 place-items-center border ${
          tone === "danger"
            ? "border-red-200 bg-red-50 text-red-500"
            : "border-border/70 bg-cream text-accent"
        }`}
      >
        <Icon size={16} strokeWidth={1.7} />
      </span>
      <h3
        className={`font-display text-xl ${tone === "danger" ? "text-red-700" : "text-foreground"}`}
      >
        {title}
      </h3>
    </div>
  );
}

interface LanguageOption {
  id: Lang;
  native: string;
}

const languages: LanguageOption[] = [
  { id: "uz", native: "O‘zbekcha" },
  { id: "ru", native: "Русский" },
];

function LanguageFlag({ code }: { code: Lang }) {
  if (code === "ru") {
    return (
      <svg
        viewBox="0 0 24 16"
        aria-hidden="true"
        className="h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-border/60"
      >
        <rect width="24" height="16" fill="#fff" />
        <rect y="5.33" width="24" height="5.34" fill="#0039A6" />
        <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 16"
      aria-hidden="true"
      className="h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-border/60"
    >
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5" fill="#0099B5" />
      <rect y="5" width="24" height="0.6" fill="#CE1126" />
      <rect y="10.4" width="24" height="0.6" fill="#CE1126" />
      <rect y="11" width="24" height="5" fill="#1EB53A" />
      <circle cx="3.6" cy="2.5" r="1.45" fill="#fff" />
      <circle cx="4.15" cy="2.5" r="1.2" fill="#0099B5" />
      <circle cx="6.3" cy="1.3" r="0.28" fill="#fff" />
      <circle cx="8.2" cy="1.3" r="0.28" fill="#fff" />
      <circle cx="10.1" cy="1.3" r="0.28" fill="#fff" />
      <circle cx="7.25" cy="2.5" r="0.28" fill="#fff" />
      <circle cx="9.15" cy="2.5" r="0.28" fill="#fff" />
      <circle cx="11.05" cy="2.5" r="0.28" fill="#fff" />
      <circle cx="8.2" cy="3.7" r="0.28" fill="#fff" />
      <circle cx="10.1" cy="3.7" r="0.28" fill="#fff" />
    </svg>
  );
}

export function SettingsPanel() {
  const { t, lang, setLang } = useI18n();
  const { user, token, setAuth, logout } = useAuth();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  const [name, setName] = useState(user?.name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [delPassword, setDelPassword] = useState("");
  const [delSaving, setDelSaving] = useState(false);
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  if (!user) return null;

  const saveName = async () => {
    setNameSaving(true);
    setNameMsg(null);
    try {
      const result = await api.patch<{ user: User }>("/auth/me", { name: name.trim() });
      if (token) setAuth(result.user, token);
      setNameMsg({ ok: true, text: t("Name updated") });
    } catch (err) {
      setNameMsg({
        ok: false,
        text: err instanceof Error ? t(err.message) : t("Failed to update name"),
      });
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async () => {
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.patch("/auth/password", pwForm);
      setPwForm({ currentPassword: "", newPassword: "" });
      setPwMsg({ ok: true, text: t("Password updated") });
    } catch (err) {
      setPwMsg({
        ok: false,
        text: err instanceof Error ? t(err.message) : t("Failed to update password"),
      });
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async () => {
    const ok = await confirm({
      title: t("Delete account?"),
      description: t(
        "Are you sure you want to permanently delete your account? Your orders, addresses and chat history will be removed. This cannot be undone.",
      ),
      confirmLabel: t("Delete account"),
      destructive: true,
    });
    if (!ok) return;

    setDelSaving(true);
    setDelMsg(null);
    try {
      await api.delete("/auth/account", { password: delPassword });
      toast.success(t("Account deleted"));
      setDelMsg({ ok: true, text: t("Account deleted") });
      setTimeout(() => {
        logout();
        router.navigate({ to: "/" });
      }, 700);
    } catch (err) {
      setDelMsg({
        ok: false,
        text: err instanceof Error ? t(err.message) : t("Failed to delete account"),
      });
    } finally {
      setDelSaving(false);
    }
  };

  const chooseLanguage = (next: Lang) => {
    setLang(next);
    toast.success(t("Language updated"));
  };

  return (
    <div>
      <SectionHeading title={t("Settings & Profile")} />

      <div className="mt-6 space-y-4">
        <section className={cardClass}>
          <div className="flex items-center gap-4">
            <UserAvatar user={user} className="size-16 text-xl" />
            <div className="min-w-0">
              <p className="truncate font-sans text-xl leading-tight">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="text-xs font-medium tracking-[0.02em] text-muted-foreground first-letter:uppercase">
                {t("Full name")}
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-label={t("Full name")}
                className="mt-2 w-full border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <button
              type="button"
              onClick={saveName}
              disabled={nameSaving || name.trim().length < 2}
              className="h-[42px] bg-primary px-6 text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {nameSaving ? t("Saving...") : t("Save Name")}
            </button>
          </div>

          {nameMsg && (
            <p className={`mt-3 text-xs ${nameMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
              {nameMsg.text}
            </p>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className={`${cardClass} flex flex-col`}>
            <SectionHeader icon={Languages} title={t("Language")} />
            <div className="mt-4 flex flex-1 flex-col gap-2">
              {languages.map((option) => {
                const active = lang === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => chooseLanguage(option.id)}
                    aria-pressed={active}
                    className={`flex min-h-14 w-full flex-1 cursor-pointer items-center justify-between gap-3 border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/40 hover:bg-cream/40"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <LanguageFlag code={option.id} />
                      <span className="truncate text-sm font-medium">{option.native}</span>
                    </span>
                    {active && <Check size={14} className="shrink-0 text-accent" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cardClass}>
            <SectionHeader icon={Lock} title={t("Security")} />
            <div className="mt-4 space-y-2.5">
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(event) => setPwForm({ ...pwForm, currentPassword: event.target.value })}
                placeholder={t("Current password")}
                aria-label={t("Current password")}
                autoComplete="new-password"
                className="w-full border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(event) => setPwForm({ ...pwForm, newPassword: event.target.value })}
                placeholder={t("New password")}
                aria-label={t("New password")}
                autoComplete="new-password"
                className="w-full border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={savePassword}
                disabled={pwSaving || !pwForm.currentPassword || pwForm.newPassword.length < 6}
                className="w-full bg-primary px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pwSaving ? t("Updating...") : t("Update Password")}
              </button>
            </div>
            {pwMsg && (
              <p className={`mt-3 text-xs ${pwMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                {pwMsg.text}
              </p>
            )}
          </section>
        </div>

        <section className={cardClass}>
          <AddressBook />
        </section>

        <section className="border border-red-200 bg-transparent p-5 sm:p-6">
          <SectionHeader icon={Trash2} title={t("Delete account")} tone="danger" />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="password"
              value={delPassword}
              onChange={(event) => setDelPassword(event.target.value)}
              placeholder={t("Enter your password to confirm")}
              aria-label={t("Enter your password to confirm")}
              autoComplete="current-password"
              className="w-full flex-1 border border-red-200 bg-background px-3 py-2.5 text-sm outline-none focus:border-red-400"
            />
            <button
              type="button"
              onClick={deleteAccount}
              disabled={delSaving || delPassword.length === 0}
              className="flex items-center justify-center gap-2 bg-red-600 px-6 py-2.5 text-[10px] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {delSaving ? t("Deleting...") : t("Delete account")}
            </button>
          </div>
          {delMsg && (
            <p className={`mt-3 text-xs ${delMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
              {delMsg.text}
            </p>
          )}
        </section>
      </div>

      {dialog}
    </div>
  );
}
