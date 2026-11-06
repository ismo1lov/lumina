import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Loader, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { formatUZS } from "@/data/products";

interface PaymentStatus {
  orderId: string;
  orderStatus: string;
  payment: string;
  paymentStatus: string;
  total: number;
  provider: string;
  providerState: string | null;
  canRetry: boolean;
}

export const Route = createFileRoute("/payment/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === "string" ? search.orderId : "",
  }),
  head: () => ({
    meta: [
      { title: "Payment result — Lumina Home" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentResultPage,
});

function PaymentResultPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { orderId } = Route.useSearch();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const result = await api.get<PaymentStatus>(`/payments/status/${orderId}`);
      setStatus(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Could not load payment status"));
    }
  }, [orderId, t]);

  useEffect(() => {
    if (!orderId || !user) return;
    let active = true;
    let attempts = 0;
    let timer: number | undefined;

    const tick = async () => {
      if (!active) return;
      await load();
      attempts += 1;
      if (attempts >= 40 && active && timer !== undefined) {
        window.clearInterval(timer);
      }
    };

    void tick();
    timer = window.setInterval(tick, 3000);

    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [orderId, user, load]);

  const retry = async () => {
    if (!orderId) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.post<{ redirectUrl: string }>(`/payments/retry/${orderId}`);
      window.location.assign(result.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? t(err.message) : t("Could not start payment"));
      setBusy(false);
    }
  };

  if (!orderId) {
    return (
      <Shell>
        <XCircle size={26} className="text-red-500" />
        <h1 className="mt-6 font-display text-3xl">{t("Order not found")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("The page you're looking for doesn't exist or has been moved.")}
        </p>
        <Link
          to="/catalog"
          className="mt-8 inline-block bg-primary px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground"
        >
          {t("Back to catalog")}
        </Link>
      </Shell>
    );
  }

  if (authLoading) {
    return (
      <Shell>
        <Loader size={24} className="animate-spin text-accent" />
        <p className="mt-5 text-sm text-muted-foreground">{t("Loading…")}</p>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Clock size={26} className="text-amber-500" />
        <h1 className="mt-6 font-display text-3xl">{t("Sign in to view payment status")}</h1>
        <Link
          to="/login"
          className="mt-8 inline-block bg-primary px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground"
        >
          {t("Sign In")}
        </Link>
      </Shell>
    );
  }

  if (!status && !error) {
    return (
      <Shell>
        <Loader size={24} className="animate-spin text-accent" />
        <h1 className="mt-6 font-display text-3xl">{t("Checking payment…")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("We are checking your payment. This page will update automatically.")}
        </p>
      </Shell>
    );
  }

  if (error && !status) {
    return (
      <Shell>
        <XCircle size={26} className="text-red-500" />
        <h1 className="mt-6 font-display text-3xl">{t("Could not load payment status")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="bg-primary px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground"
          >
            {t("Try again")}
          </button>
          <Link
            to="/dashboard"
            className="border border-border px-7 py-3.5 text-[11px] uppercase tracking-[0.2em]"
          >
            {t("Back to account")}
          </Link>
        </div>
      </Shell>
    );
  }

  const paymentStatus = status?.paymentStatus ?? "pending";
  const paid = paymentStatus === "paid";
  const failed = ["failed", "cancelled"].includes(paymentStatus);
  const refunded = paymentStatus === "refunded";

  return (
    <Shell>
      <span
        className={`grid size-14 place-items-center rounded-full ${
          paid
            ? "bg-emerald-100 text-emerald-700"
            : failed || refunded
              ? "bg-red-100 text-red-600"
              : "bg-amber-100 text-amber-700"
        }`}
      >
        {paid ? (
          <Check size={22} />
        ) : failed || refunded ? (
          <XCircle size={22} />
        ) : (
          <Clock size={22} />
        )}
      </span>

      <h1 className="mt-6 font-display text-4xl">
        {paid
          ? t("Payment successful")
          : refunded
            ? t("Refunded")
            : failed
              ? t("Payment failed")
              : t("Payment pending")}
      </h1>

      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {t("Order number")}: {orderId}
      </p>

      {status && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Amount")}: <span className="text-foreground">{formatUZS(status.total)}</span>
          {" · "}
          {t("Payment method")}: <span className="capitalize text-foreground">{status.payment}</span>
        </p>
      )}

      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
        {paid
          ? t("Your order has been paid. We will contact you to confirm delivery.")
          : refunded
            ? t("Refunded")
            : failed
              ? t("The payment was not completed. You can try again from your account.")
              : t("We are checking your payment. This page will update automatically.")}
      </p>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {status?.canRetry && !paid && !refunded && (
          <button
            type="button"
            onClick={() => void retry()}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50"
          >
            {busy && <Loader size={13} className="animate-spin" />}
            {t("Retry payment")}
          </button>
        )}
        <Link
          to="/dashboard"
          className="border border-border px-7 py-3.5 text-[11px] uppercase tracking-[0.2em]"
        >
          {t("Back to account")}
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-32 text-center">
      {children}
    </div>
  );
}
