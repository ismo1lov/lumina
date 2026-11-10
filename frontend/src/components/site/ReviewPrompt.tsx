import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Star, Loader } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export type ReviewSummary = { average: number; count: number };

type ReviewPromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string; image?: string };
  initialRating?: number | null;
  initialComment?: string;
  onSubmitted?: (summary: ReviewSummary) => void;
  onDismiss?: () => void;
};

/**
 * Asks the visitor to rate and review a product they are looking at.
 * Follows the usual review-request pattern: stars first, optional comment,
 * a primary "Rate" action and a guilt-free "Later" escape hatch.
 */
export function ReviewPrompt({
  open,
  onOpenChange,
  product,
  initialRating = null,
  initialComment = "",
  onSubmitted,
  onDismiss,
}: ReviewPromptProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(initialRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);

  // Reset the form every time the dialog opens so it always matches the
  // state we have for this visitor.
  useEffect(() => {
    if (!open) return;
    submittedRef.current = false;
    setRating(initialRating ?? 0);
    setComment(initialComment ?? "");
    setHover(0);
    setError("");
  }, [open, initialRating, initialComment]);

  const submit = async () => {
    if (!user) {
      navigate({ to: "/login", search: { mode: "login" } });
      return;
    }
    if (rating < 1) {
      setError(t("Please choose a rating"));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await api.post<ReviewSummary & { ok: boolean }>(`/reviews/${product.id}`, {
        rating,
        comment: comment.trim(),
      });
      submittedRef.current = true;
      toast.success(t("Thank you! Your review has been published."));
      onSubmitted?.({ average: Number(result.average ?? 0), count: Number(result.count ?? 0) });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to send review"));
    } finally {
      setBusy(false);
    }
  };

  const active = hover || rating;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !submittedRef.current) onDismiss?.();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-snug">
            {t("Rate this product")}
          </DialogTitle>
        </DialogHeader>

        {user ? (
          <>
            <div
              className="mt-6 flex items-center gap-1"
              onMouseLeave={() => setHover(0)}
              aria-label={t("Your rating")}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t("Rate {count} out of 5", { count: i })}
                  aria-pressed={rating === i}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onClick={() => {
                    setRating(i);
                    setError("");
                  }}
                  className="cursor-pointer p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={i <= active ? "fill-accent text-accent" : "text-border"}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder={t("Write your review")}
              className="mt-6 w-full resize-none border-b bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent"
            />
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{t("Sign in to rate this product")}</p>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              submittedRef.current = true;
              onDismiss?.();
              onOpenChange(false);
            }}
            className="cursor-pointer border border-foreground/25 px-6 py-3.5 text-[11px] uppercase tracking-[0.2em] transition-colors hover:border-foreground"
          >
            {t("Later")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center gap-2 bg-primary px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader size={13} className="animate-spin" />}
            {user ? t("Rate") : t("Sign In")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
