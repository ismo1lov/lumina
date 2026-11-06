import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { getDb } from "../db/index.js";
import { payments } from "../db/schema.js";

export type PaymentProvider = "payme" | "click";

export interface PaymentConfig {
  payme: boolean;
  click: boolean;
  visa: boolean;
  mock: boolean;
}

/** Assembly is charged per piece, exactly as shown on the product page. */
export const ASSEMBLY_FEE = 150000;

export const DELIVERY_FEES: Record<string, number> = { standard: 0, express: 250000 };

function envFlag(name: string): boolean {
  return (process.env[name] ?? "").toLowerCase() !== "false";
}

export function isPaymeConfigured(): boolean {
  return (
    envFlag("PAYME_ENABLED") &&
    Boolean(process.env.PAYME_MERCHANT_ID?.trim()) &&
    Boolean(process.env.PAYME_KEY?.trim())
  );
}

export function isClickConfigured(): boolean {
  return (
    envFlag("CLICK_ENABLED") &&
    Boolean(process.env.CLICK_SERVICE_ID?.trim()) &&
    Boolean(process.env.CLICK_MERCHANT_ID?.trim()) &&
    Boolean(process.env.CLICK_SECRET_KEY?.trim())
  );
}

export function getPaymentConfig(): PaymentConfig {
  const payme = isPaymeConfigured();
  const click = isClickConfigured();
  return {
    payme,
    click,
    // Visa is accepted through the acquiring bank behind Payme/Click.
    visa: payme || click,
    // A mock provider is deliberately not offered: orders are only marked
    // paid after a signed provider callback.
    mock: false,
  };
}

export function publicAppUrl(): string {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const firstCorsOrigin = process.env.CORS_ORIGINS?.split(",")[0]?.trim();
  return (firstCorsOrigin || "http://localhost:5173").replace(/\/+$/, "");
}

export function paymentReturnUrl(orderId: string): string {
  return `${publicAppUrl()}/payment/result?orderId=${encodeURIComponent(orderId)}`;
}

export function paymeCheckoutUrl(orderId: string, amountUzs: number, lang = "uz"): string {
  const merchantId = process.env.PAYME_MERCHANT_ID!.trim();
  const base = (process.env.PAYME_CHECKOUT_URL || "https://checkout.paycom.uz").replace(/\/+$/, "");
  const params = [
    `m=${merchantId}`,
    `ac.order_id=${orderId}`,
    `a=${Math.round(amountUzs * 100)}`,
    `l=${lang === "ru" ? "ru" : "uz"}`,
    `c=${encodeURIComponent(paymentReturnUrl(orderId))}`,
  ].join(";");
  return `${base}/${Buffer.from(params, "utf8").toString("base64")}`;
}

export function clickCheckoutUrl(orderId: string, amountUzs: number): string {
  const base = (process.env.CLICK_CHECKOUT_URL || "https://my.click.uz/services/pay").replace(
    /\/+$/,
    "",
  );
  const params = new URLSearchParams({
    service_id: process.env.CLICK_SERVICE_ID!.trim(),
    merchant_id: process.env.CLICK_MERCHANT_ID!.trim(),
    amount: String(Math.round(amountUzs)),
    transaction_param: orderId,
    return_url: paymentReturnUrl(orderId),
  });
  return `${base}?${params.toString()}`;
}

export function providerCheckoutUrl(provider: string, orderId: string, amount: number, lang = "uz") {
  if (provider === "payme") return paymeCheckoutUrl(orderId, amount, lang);
  if (provider === "click") return clickCheckoutUrl(orderId, amount);
  return null;
}

/**
 * Creates a pending payment row and returns the provider-hosted checkout URL.
 * The row is only an intent; the order is not marked paid here.
 */
export async function createPaymentIntent(order: {
  id: string;
  userId: string;
  total: number;
  payment: string;
}) {
  if (order.payment === "payme" && !isPaymeConfigured()) return null;
  if (order.payment === "click" && !isClickConfigured()) return null;
  const redirectUrl = providerCheckoutUrl(order.payment, order.id, order.total);
  if (!redirectUrl) return null;

  const db = await getDb();
  const paymentId = randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    orderId: order.id,
    userId: order.userId,
    provider: order.payment,
    amount: order.total,
    state: "created",
    providerCreateTime: Date.now(),
  });

  return { paymentId, redirectUrl };
}

/* ── Payme helpers ─────────────────────────────────────────────────────── */

export const PAYME_ERRORS = {
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  CANNOT_CANCEL: -31007,
  UNABLE_TO_PERFORM: -31008,
  ORDER_NOT_FOUND: -31050,
  ORDER_ALREADY_PAID: -31051,
  ORDER_CANCELLED: -31052,
  AUTH_FAILED: -32504,
  METHOD_NOT_FOUND: -32601,
  INTERNAL_ERROR: -32400,
  INVALID_REQUEST: -32600,
} as const;

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyPaymeAuth(authorization: string | undefined): boolean {
  const key = process.env.PAYME_KEY?.trim();
  if (!key || !authorization?.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator === -1) return false;
    const login = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return login === "Paycom" && safeEqual(password, key);
  } catch {
    return false;
  }
}

export function paymeError(id: unknown, code: number, message: string, data?: unknown) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

export function paymeResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

export function paymeState(row: { state: string; providerPerformTime: number }): number {
  if (row.state === "cancelled") return row.providerPerformTime > 0 ? -2 : -1;
  if (row.state === "performed") return 2;
  return 1;
}

export function paymeAccountOrderId(account: unknown): string | null {
  if (!account || typeof account !== "object") return null;
  const value = account as Record<string, unknown>;
  const orderId = value.order_id ?? value.orderId;
  return typeof orderId === "string" && orderId.trim() ? orderId.trim() : null;
}

/* ── Click helpers ─────────────────────────────────────────────────────── */

export function clickSign(params: {
  clickTransId: string;
  serviceId: string;
  secretKey: string;
  merchantTransId: string;
  merchantPrepareId?: string;
  amount: string;
  action: string;
  signTime: string;
}): string {
  // Click includes merchant_prepare_id in the Complete signature only.
  const source = [
    params.clickTransId,
    params.serviceId,
    params.secretKey,
    params.merchantTransId,
    ...(params.merchantPrepareId !== undefined ? [params.merchantPrepareId] : []),
    params.amount,
    params.action,
    params.signTime,
  ].join("");
  return createHash("md5").update(source, "utf8").digest("hex");
}

export function verifyClickSign(params: {
  clickTransId: string;
  serviceId: string;
  merchantTransId: string;
  merchantPrepareId?: string;
  amount: string;
  action: string;
  signTime: string;
  signString: string;
}): boolean {
  const secretKey = process.env.CLICK_SECRET_KEY?.trim();
  if (!secretKey) return false;
  const expected = clickSign({ ...params, secretKey });
  return safeEqual(expected.toLowerCase(), params.signString.toLowerCase());
}
