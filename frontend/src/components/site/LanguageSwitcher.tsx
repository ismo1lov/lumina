import { useI18n, type Lang } from "@/lib/i18n";

const options: { lang: Lang; label: string; full: string }[] = [
  { lang: "uz", label: "UZ", full: "O‘zbekcha" },
  { lang: "ru", label: "RU", full: "Русский" },
];

export function LanguageSwitcher({
  className = "",
  variant = "compact",
}: {
  className?: string;
  /** "compact" — small UZ / RU toggle, "full" — two labelled buttons. */
  variant?: "compact" | "full";
}) {
  const { lang, setLang, t } = useI18n();

  if (variant === "full") {
    return (
      <div className={`grid gap-2 sm:grid-cols-2 ${className}`} role="group" aria-label={t("Language")}>
        {options.map((option) => (
          <button
            key={option.lang}
            type="button"
            onClick={() => setLang(option.lang)}
            aria-pressed={lang === option.lang}
            className={`cursor-pointer rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              lang === option.lang
                ? "border-walnut bg-walnut text-cream"
                : "border-border bg-background/50 text-muted-foreground hover:border-walnut/40 hover:text-walnut"
            }`}
          >
            {option.full}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] ${className}`}
      aria-label={t("Language")}
    >
      {options.map((option, index) => (
        <span key={option.lang} className="flex items-center gap-1">
          {index > 0 && <span className="text-muted-foreground/40">/</span>}
          <button
            type="button"
            onClick={() => setLang(option.lang)}
            aria-label={option.full}
            aria-pressed={lang === option.lang}
            className={`cursor-pointer rounded px-1 py-0.5 transition-colors ${
              lang === option.lang
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  );
}
