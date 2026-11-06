import { Router } from "express";
import { randomUUID } from "crypto";
import { and, desc, eq, gte, lte, ne } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { orders, payments } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  PAYME_ERRORS,
  createPaymentIntent,
  getPaymentConfig,
  isClickConfigured,
  isPaymeConfigured,
  paymeAccountOrderId,
  paymeError,
  paymeResult,
  paymeState,
  verifyClickSign,
  verifyPaymeAuth,
} from "../lib/payments.js";

const router = Router();

/* ── Public configuration ──────────────────────────────────────────────── */

router.get("/config", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(getPaymentConfig());
});

/* ── Customer payment status / retry ──────────────────────────────────── */

async function findOwnedOrder(orderId: string, userId: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  return order ?? null;
}

router.get("/status/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await findOwnedOrder(String(req.params.orderId), req.userId!);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const db = await getDb();
    const [latest] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.providerCreateTime), desc(payments.createdAt))
      .limit(1);

    const provider = latest?.provider || order.payment;
    const config = getPaymentConfig();
    const providerReady =
      (provider === "payme" && config.payme) || (provider === "click" && config.click);

    res.set("Cache-Control", "no-store");
    res.json({
      orderId: order.id,
      orderStatus: order.status,
      payment: order.payment,
      paymentStatus: order.paymentStatus,
      total: order.total,
      provider,
      providerState: latest?.state ?? null,
      providerTransactionId: latest?.providerTransactionId ?? "",
      canRetry:
        providerReady &&
        order.status !== "cancelled" &&
        order.paymentStatus !== "paid" &&
        order.paymentStatus !== "refunded" &&
        ["payme", "click"].includes(order.payment),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/retry/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await findOwnedOrder(String(req.params.orderId), req.userId!);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (order.status === "cancelled") {
      res.status(400).json({ error: "Cancelled orders cannot be paid" });
      return;
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
      res.status(400).json({ error: "This order has already been paid" });
      return;
    }
    if (!["payme", "click"].includes(order.payment)) {
      res.status(400).json({ error: "This order does not use online payment" });
      return;
    }

    const config = getPaymentConfig();
    if (
      (order.payment === "payme" && !config.payme) ||
      (order.payment === "click" && !config.click)
    ) {
      res.status(400).json({ error: "This payment method is not configured yet" });
      return;
    }

    const intent = await createPaymentIntent(order);
    if (!intent) {
      res.status(400).json({ error: "This payment method is not configured yet" });
      return;
    }

    const db = await getDb();
    await db
      .update(orders)
      .set({ paymentStatus: "pending" })
      .where(eq(orders.id, order.id));

    res.json({ orderId: order.id, redirectUrl: intent.redirectUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Payme Merchant API (JSON-RPC 2.0) ─────────────────────────────────── */

function asString(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function asAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

router.post("/payme", async (req, res) => {
  const body = req.body as Record<string, unknown> | undefined;
  const rpcId = body?.id ?? null;

  if (!verifyPaymeAuth(req.headers.authorization)) {
    res.json(paymeError(rpcId, PAYME_ERRORS.AUTH_FAILED, "Insufficient privileges"));
    return;
  }
  if (!isPaymeConfigured()) {
    res.json(paymeError(rpcId, PAYME_ERRORS.AUTH_FAILED, "Payme is not configured"));
    return;
  }
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    res.json(paymeError(rpcId, PAYME_ERRORS.INVALID_REQUEST, "Invalid request"));
    return;
  }

  const method = body.method;
  const params = (body.params ?? {}) as Record<string, unknown>;

  try {
    switch (method) {
      case "CheckPerformTransaction":
        return await paymeCheckPerform(res, rpcId, params);
      case "CreateTransaction":
        return await paymeCreateTransaction(res, rpcId, params);
      case "PerformTransaction":
        return await paymePerformTransaction(res, rpcId, params);
      case "CancelTransaction":
        return await paymeCancelTransaction(res, rpcId, params);
      case "CheckTransaction":
        return await paymeCheckTransaction(res, rpcId, params);
      case "GetStatement":
        return await paymeGetStatement(res, rpcId, params);
      default:
        res.json(paymeError(rpcId, PAYME_ERRORS.METHOD_NOT_FOUND, "Method not found"));
        return;
    }
  } catch (err) {
    console.error("Payme callback error:", err);
    res.json(paymeError(rpcId, PAYME_ERRORS.INTERNAL_ERROR, "Internal server error"));
  }
});

async function loadPaymeOrder(
  params: Record<string, unknown>,
  rpcId: unknown,
  res: import("express").Response,
) {
  const orderId = paymeAccountOrderId(params.account);
  if (!orderId) {
    res.json(
      paymeError(rpcId, PAYME_ERRORS.ORDER_NOT_FOUND, "Order not found", { order_id: null }),
    );
    return null;
  }

  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_NOT_FOUND, "Order not found", { order_id: orderId }));
    return null;
  }
  return order;
}

function paymeAmountMatches(params: Record<string, unknown>, totalUzs: number): boolean {
  const amount = asAmount(params.amount);
  return amount !== null && Number.isInteger(amount) && amount === Math.round(totalUzs * 100);
}

async function paymeCheckPerform(
  res: import("express").Response,
  rpcId: unknown,
  params: Record<string, unknown>,
) {
  const order = await loadPaymeOrder(params, rpcId, res);
  if (!order) return;

  if (!paymeAmountMatches(params, order.total)) {
    res.json(
      paymeError(rpcId, PAYME_ERRORS.INVALID_AMOUNT, "Invalid amount", {
        amount: params.amount ?? null,
      }),
    );
    return;
  }
  if (order.status === "cancelled") {
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_CANCELLED, "Order cancelled"));
    return;
  }
  if (order.payment !== "payme") {
    res.json(paymeError(rpcId, PAYME_ERRORS.UNABLE_TO_PERFORM, "Order does not use Payme"));
    return;
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_ALREADY_PAID, "Order already paid"));
    return;
  }

  res.json(paymeResult(rpcId, { allow: true }));
}

async function paymeCreateTransaction(
  res: import("express").Response,
  rpcId: unknown,
  params: Record<string, unknown>,
) {
  const transactionId = asString(params.id);
  const time = asAmount(params.time);
  if (!transactionId || time === null) {
    res.json(paymeError(rpcId, PAYME_ERRORS.INVALID_REQUEST, "Invalid transaction parameters"));
    return;
  }

  const order = await loadPaymeOrder(params, rpcId, res);
  if (!order) return;

  if (!paymeAmountMatches(params, order.total)) {
    res.json(
      paymeError(rpcId, PAYME_ERRORS.INVALID_AMOUNT, "Invalid amount", {
        amount: params.amount ?? null,
      }),
    );
    return;
  }
  if (order.status === "cancelled") {
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_CANCELLED, "Order cancelled"));
    return;
  }
  if (order.payment !== "payme") {
    res.json(paymeError(rpcId, PAYME_ERRORS.UNABLE_TO_PERFORM, "Order does not use Payme"));
    return;
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_ALREADY_PAID, "Order already paid"));
    return;
  }

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, "payme"), eq(payments.providerTransactionId, transactionId)))
    .limit(1);

  if (existing) {
    if (existing.orderId !== order.id) {
      res.json(paymeError(rpcId, PAYME_ERRORS.UNABLE_TO_PERFORM, "Transaction belongs to another order"));
      return;
    }
    if (existing.state === "cancelled") {
      res.json(paymeError(rpcId, PAYME_ERRORS.UNABLE_TO_PERFORM, "Transaction was cancelled"));
      return;
    }
    res.json(
      paymeResult(rpcId, {
        create_time: Number(existing.providerCreateTime) || Math.round(time),
        transaction: existing.providerTransactionId,
        state: paymeState({
          state: existing.state,
          providerPerformTime: Number(existing.providerPerformTime),
        }),
        ...(existing.state === "performed"
          ? { perform_time: Number(existing.providerPerformTime) }
          : {}),
      }),
    );
    return;
  }

  const [active] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.orderId, order.id),
        eq(payments.provider, "payme"),
        eq(payments.state, "created"),
      ),
    )
    .orderBy(desc(payments.providerCreateTime), desc(payments.createdAt))
    .limit(1);
  if (active) {
    if (active.providerTransactionId && active.providerTransactionId !== transactionId) {
      res.json(
        paymeError(rpcId, PAYME_ERRORS.UNABLE_TO_PERFORM, "Another transaction is already in progress"),
      );
      return;
    }

    await db
      .update(payments)
      .set({
        providerTransactionId: transactionId,
        providerCreateTime: Math.round(time),
        rawRequest: JSON.stringify(params),
      })
      .where(eq(payments.id, active.id));
    await db.update(orders).set({ paymentStatus: "pending" }).where(eq(orders.id, order.id));

    res.json(
      paymeResult(rpcId, {
        create_time: Math.round(time),
        transaction: transactionId,
        state: 1,
      }),
    );
    return;
  }

  const paymentId = randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    orderId: order.id,
    userId: order.userId,
    provider: "payme",
    providerTransactionId: transactionId,
    amount: order.total,
    state: "created",
    providerCreateTime: Math.round(time),
    rawRequest: JSON.stringify(params),
  });
  await db.update(orders).set({ paymentStatus: "pending" }).where(eq(orders.id, order.id));

  res.json(
    paymeResult(rpcId, {
      create_time: Math.round(time),
      transaction: transactionId,
      state: 1,
    }),
  );
}

async function paymePerformTransaction(
  res: import("express").Response,
  rpcId: unknown,
  params: Record<string, unknown>,
) {
  const transactionId = asString(params.id);
  if (!transactionId) {
    res.json(paymeError(rpcId, PAYME_ERRORS.INVALID_REQUEST, "Invalid transaction id"));
    return;
  }

  const db = await getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, "payme"), eq(payments.providerTransactionId, transactionId)))
    .limit(1);
  if (!payment) {
    res.json(paymeError(rpcId, PAYME_ERRORS.TRANSACTION_NOT_FOUND, "Transaction not found"));
    return;
  }
  if (payment.state === "cancelled") {
    res.json(paymeError(rpcId, PAYME_ERRORS.UNABLE_TO_PERFORM, "Transaction was cancelled"));
    return;
  }
  if (payment.state === "performed") {
    res.json(
      paymeResult(rpcId, {
        transaction: transactionId,
        perform_time: Number(payment.providerPerformTime),
        state: 2,
      }),
    );
    return;
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
  if (!order) {
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_NOT_FOUND, "Order not found"));
    return;
  }
  if (order.status === "cancelled" || order.payment !== "payme") {
    await db
      .update(payments)
      .set({ state: "cancelled", providerCancelTime: Date.now() })
      .where(eq(payments.id, payment.id));
    res.json(paymeError(rpcId, PAYME_ERRORS.ORDER_CANCELLED, "Order cancelled"));
    return;
  }

  const performTime = Date.now();
  await db
    .update(payments)
    .set({ state: "performed", providerPerformTime: performTime })
    .where(eq(payments.id, payment.id));

  await db
    .update(orders)
    .set({
      paymentStatus: "paid",
      ...(order.status === "pending" ? { status: "confirmed" } : {}),
    })
    .where(eq(orders.id, order.id));

  res.json(
    paymeResult(rpcId, {
      transaction: transactionId,
      perform_time: performTime,
      state: 2,
    }),
  );
}

async function paymeCancelTransaction(
  res: import("express").Response,
  rpcId: unknown,
  params: Record<string, unknown>,
) {
  const transactionId = asString(params.id);
  if (!transactionId) {
    res.json(paymeError(rpcId, PAYME_ERRORS.INVALID_REQUEST, "Invalid transaction id"));
    return;
  }

  const db = await getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, "payme"), eq(payments.providerTransactionId, transactionId)))
    .limit(1);
  if (!payment) {
    res.json(paymeError(rpcId, PAYME_ERRORS.TRANSACTION_NOT_FOUND, "Transaction not found"));
    return;
  }
  if (payment.state === "cancelled") {
    res.json(
      paymeResult(rpcId, {
        transaction: transactionId,
        cancel_time: Number(payment.providerCancelTime),
        state: paymeState({
          state: payment.state,
          providerPerformTime: Number(payment.providerPerformTime),
        }),
      }),
    );
    return;
  }

  const wasPerformed = payment.state === "performed";
  const cancelTime = Date.now();
  await db
    .update(payments)
    .set({
      state: "cancelled",
      providerCancelTime: cancelTime,
      cancelReason: Math.round(asAmount(params.reason) ?? 0),
    })
    .where(eq(payments.id, payment.id));

  await db
    .update(orders)
    .set({ paymentStatus: wasPerformed ? "refunded" : "failed" })
    .where(eq(orders.id, payment.orderId));

  res.json(
    paymeResult(rpcId, {
      transaction: transactionId,
      cancel_time: cancelTime,
      state: wasPerformed ? -2 : -1,
    }),
  );
}

async function paymeCheckTransaction(
  res: import("express").Response,
  rpcId: unknown,
  params: Record<string, unknown>,
) {
  const transactionId = asString(params.id);
  if (!transactionId) {
    res.json(paymeError(rpcId, PAYME_ERRORS.INVALID_REQUEST, "Invalid transaction id"));
    return;
  }

  const db = await getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, "payme"), eq(payments.providerTransactionId, transactionId)))
    .limit(1);
  if (!payment) {
    res.json(paymeError(rpcId, PAYME_ERRORS.TRANSACTION_NOT_FOUND, "Transaction not found"));
    return;
  }

  res.json(
    paymeResult(rpcId, {
      transaction: transactionId,
      create_time: Number(payment.providerCreateTime),
      perform_time: Number(payment.providerPerformTime),
      cancel_time: Number(payment.providerCancelTime),
      state: paymeState({
        state: payment.state,
        providerPerformTime: Number(payment.providerPerformTime),
      }),
      reason: payment.cancelReason || null,
    }),
  );
}

async function paymeGetStatement(
  res: import("express").Response,
  rpcId: unknown,
  params: Record<string, unknown>,
) {
  const from = asAmount(params.from);
  const to = asAmount(params.to);
  if (from === null || to === null) {
    res.json(paymeError(rpcId, PAYME_ERRORS.INVALID_REQUEST, "Invalid statement period"));
    return;
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.provider, "payme"),
        ne(payments.providerTransactionId, ""),
        gte(payments.providerCreateTime, Math.round(from)),
        lte(payments.providerCreateTime, Math.round(to)),
      ),
    )
    .orderBy(payments.providerCreateTime);

  res.json(
    paymeResult(rpcId, {
      transactions: rows.map((row) => ({
        id: row.providerTransactionId,
        time: Number(row.providerCreateTime),
        amount: Math.round(row.amount * 100),
        account: { order_id: row.orderId },
        create_time: Number(row.providerCreateTime),
        perform_time: Number(row.providerPerformTime),
        cancel_time: Number(row.providerCancelTime),
        transaction: row.providerTransactionId,
        state: paymeState({
          state: row.state,
          providerPerformTime: Number(row.providerPerformTime),
        }),
        reason: row.cancelReason || null,
      })),
    }),
  );
}

/* ── Click Shop API (Prepare / Complete) ──────────────────────────────── */

interface ClickRequestData {
  clickTransId: string;
  serviceId: string;
  clickPaydocId: string;
  merchantTransId: string;
  merchantPrepareId: string;
  amount: string;
  action: string;
  error: string;
  errorNote: string;
  signTime: string;
  signString: string;
}

function readClickRequest(body: Record<string, unknown>): ClickRequestData {
  return {
    clickTransId: asString(body.click_trans_id),
    serviceId: asString(body.service_id),
    clickPaydocId: asString(body.click_paydoc_id),
    merchantTransId: asString(body.merchant_trans_id),
    merchantPrepareId: asString(body.merchant_prepare_id),
    amount: asString(body.amount),
    action: asString(body.action),
    error: asString(body.error),
    errorNote: asString(body.error_note),
    signTime: asString(body.sign_time),
    signString: asString(body.sign_string),
  };
}

function clickReply(
  res: import("express").Response,
  data: ClickRequestData,
  error: number,
  note: string,
  extra: Record<string, unknown> = {},
) {
  res.json({
    click_trans_id: data.clickTransId,
    merchant_trans_id: data.merchantTransId,
    error,
    error_note: note,
    ...extra,
  });
}

function clickAmountMatches(amount: string, totalUzs: number): boolean {
  const parsed = Number(amount);
  return Number.isFinite(parsed) && Math.round(parsed) === Math.round(totalUzs);
}

function validateClickRequest(
  req: import("express").Request,
  res: import("express").Response,
  expectedAction: "0" | "1",
) {
  const data = readClickRequest((req.body ?? {}) as Record<string, unknown>);
  const required = [
    data.clickTransId,
    data.serviceId,
    data.merchantTransId,
    data.amount,
    data.action,
    data.signTime,
    data.signString,
    ...(expectedAction === "1" ? [data.merchantPrepareId] : []),
  ];
  if (required.some((value) => !value)) {
    clickReply(res, data, -2, "Incorrect parameter");
    return null;
  }
  if (data.action !== expectedAction) {
    clickReply(res, data, -3, "Action not found");
    return null;
  }
  if (data.serviceId !== process.env.CLICK_SERVICE_ID?.trim()) {
    clickReply(res, data, -2, "Incorrect service id");
    return null;
  }
  if (
    !verifyClickSign({
      clickTransId: data.clickTransId,
      serviceId: data.serviceId,
      merchantTransId: data.merchantTransId,
      ...(expectedAction === "1" ? { merchantPrepareId: data.merchantPrepareId } : {}),
      amount: data.amount,
      action: data.action,
      signTime: data.signTime,
      signString: data.signString,
    })
  ) {
    clickReply(res, data, -1, "Sign check failed");
    return null;
  }
  return data;
}

router.post("/click/prepare", async (req, res) => {
  if (!isClickConfigured()) {
    clickReply(res, readClickRequest((req.body ?? {}) as Record<string, unknown>), -8, "Service unavailable");
    return;
  }
  const data = validateClickRequest(req, res, "0");
  if (!data) return;

  try {
    const db = await getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, data.merchantTransId))
      .limit(1);
    if (!order) {
      clickReply(res, data, -5, "Order not found");
      return;
    }
    if (order.payment !== "click") {
      clickReply(res, data, -2, "Order does not use Click");
      return;
    }
    if (!clickAmountMatches(data.amount, order.total)) {
      clickReply(res, data, -6, "Incorrect amount");
      return;
    }
    if (order.status === "cancelled") {
      clickReply(res, data, -9, "Transaction cancelled");
      return;
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
      clickReply(res, data, -4, "Already paid");
      return;
    }

    const [existing] = await db
      .select()
      .from(payments)
      .where(
        and(eq(payments.provider, "click"), eq(payments.providerTransactionId, data.clickTransId)),
      )
      .limit(1);
    if (existing) {
      if (existing.orderId !== order.id) {
        clickReply(res, data, -2, "Transaction belongs to another order");
        return;
      }
      if (existing.state === "performed") {
        clickReply(res, data, -4, "Already paid");
        return;
      }
      if (existing.state === "cancelled") {
        clickReply(res, data, -9, "Transaction cancelled");
        return;
      }
      clickReply(res, data, 0, "Success", { merchant_prepare_id: existing.id });
      return;
    }

    // A retry from Click gets a fresh transaction id. Retire stale intents.
    await db
      .update(payments)
      .set({ state: "cancelled", providerCancelTime: Date.now() })
      .where(
        and(
          eq(payments.orderId, order.id),
          eq(payments.provider, "click"),
          eq(payments.state, "created"),
        ),
      );

    const paymentId = randomUUID();
    await db.insert(payments).values({
      id: paymentId,
      orderId: order.id,
      userId: order.userId,
      provider: "click",
      providerTransactionId: data.clickTransId,
      amount: order.total,
      state: "created",
      providerCreateTime: Date.now(),
      rawRequest: JSON.stringify(req.body),
    });
    await db.update(orders).set({ paymentStatus: "pending" }).where(eq(orders.id, order.id));

    clickReply(res, data, 0, "Success", { merchant_prepare_id: paymentId });
  } catch (err) {
    console.error("Click prepare error:", err);
    clickReply(res, data, -8, "Internal server error");
  }
});

router.post("/click/complete", async (req, res) => {
  if (!isClickConfigured()) {
    clickReply(res, readClickRequest((req.body ?? {}) as Record<string, unknown>), -8, "Service unavailable");
    return;
  }
  const data = validateClickRequest(req, res, "1");
  if (!data) return;

  try {
    const db = await getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, data.merchantTransId))
      .limit(1);
    if (!order) {
      clickReply(res, data, -5, "Order not found");
      return;
    }
    if (order.payment !== "click") {
      clickReply(res, data, -2, "Order does not use Click");
      return;
    }
    if (!clickAmountMatches(data.amount, order.total)) {
      clickReply(res, data, -6, "Incorrect amount");
      return;
    }

    let [payment] = await db
      .select()
      .from(payments)
      .where(
        and(eq(payments.provider, "click"), eq(payments.providerTransactionId, data.clickTransId)),
      )
      .limit(1);

    if (!payment && data.merchantPrepareId) {
      [payment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.provider, "click"), eq(payments.id, data.merchantPrepareId)))
        .limit(1);
    }

    const clickError = Number(data.error || 0);
    if (clickError < 0) {
      const alreadyPaid = order.paymentStatus === "paid" || order.paymentStatus === "refunded";
      if (!alreadyPaid) {
        if (payment && payment.orderId === order.id) {
          await db
            .update(payments)
            .set({
              state: "cancelled",
              providerCancelTime: Date.now(),
              cancelReason: clickError,
              rawResponse: JSON.stringify(req.body),
            })
            .where(eq(payments.id, payment.id));
        }
        await db.update(orders).set({ paymentStatus: "failed" }).where(eq(orders.id, order.id));
      }
      clickReply(res, data, 0, "Success");
      return;
    }

    if (!payment) {
      clickReply(res, data, -7, "Transaction not found");
      return;
    }
    if (payment.orderId !== order.id) {
      clickReply(res, data, -2, "Transaction belongs to another order");
      return;
    }
    if (order.status === "cancelled") {
      await db
        .update(payments)
        .set({ state: "cancelled", providerCancelTime: Date.now() })
        .where(and(eq(payments.id, payment.id), eq(payments.state, "created")));
      clickReply(res, data, -9, "Transaction cancelled");
      return;
    }
    if (payment.state === "performed") {
      clickReply(res, data, 0, "Success", { merchant_confirm_id: payment.id });
      return;
    }
    if (payment.state === "cancelled") {
      clickReply(res, data, -9, "Transaction cancelled");
      return;
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
      clickReply(res, data, -4, "Already paid");
      return;
    }

    await db
      .update(payments)
      .set({
        state: "performed",
        providerPerformTime: Date.now(),
        rawResponse: JSON.stringify(req.body),
      })
      .where(eq(payments.id, payment.id));
    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        ...(order.status === "pending" ? { status: "confirmed" } : {}),
      })
      .where(eq(orders.id, order.id));

    clickReply(res, data, 0, "Success", { merchant_confirm_id: payment.id });
  } catch (err) {
    console.error("Click complete error:", err);
    clickReply(res, data, -8, "Internal server error");
  }
});


export default router;
