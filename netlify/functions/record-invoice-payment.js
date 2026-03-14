const { getStore } = require("@netlify/blobs");

function safeStr(v) {
  return (v || "").toString().trim();
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireAuth(context) {
  const user = context?.clientContext?.user;
  return user || null;
}

function makePaymentId() {
  return `pay_${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const invoiceId = safeStr(payload.invoiceId);
    const amount = Number(payload.amount);
    const method = safeStr(payload.method);
    const note = safeStr(payload.note);
    const paidAt = safeStr(payload.paidAt) || new Date().toISOString();

    if (!invoiceId) {
      return json(400, { error: "invoiceId is required" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return json(400, { error: "Payment amount must be greater than 0" });
    }

    const allowedMethods = ["cash", "check", "zelle", "card", "stripe", "bank_transfer", "other"];
    if (!method || !allowedMethods.includes(method)) {
      return json(400, { error: "Invalid payment method" });
    }

    const invoicesStore = getStore("invoices", { siteID, token });
    const invoicesIndexStore = getStore("invoices_index", { siteID, token });

    const invoice = await invoicesStore.get(invoiceId, { type: "json" });
    if (!invoice) {
      return json(404, { error: "Invoice not found" });
    }

    const grandTotal = Number(invoice.grandTotal || 0);
    const existingDepositPaid = Number(invoice.depositPaid || 0);
    const existingPayments = Array.isArray(invoice.payments) ? invoice.payments : [];
    const balanceDueBefore = Number(invoice.balanceDue ?? Math.max(0, grandTotal - existingDepositPaid));

    if (amount > balanceDueBefore) {
      return json(400, {
        error: `Payment exceeds remaining balance of ${balanceDueBefore.toFixed(2)}`,
      });
    }

    const payment = {
      id: makePaymentId(),
      amount,
      method,
      note,
      paidAt,
      recordedAt: new Date().toISOString(),
      recordedBy: {
        id: user.sub,
        email: user.email,
      },
    };

    const depositPaid = existingDepositPaid + amount;
    const balanceDue = Math.max(0, grandTotal - depositPaid);

    const paymentStatus =
      balanceDue <= 0 ? "paid" : depositPaid > 0 ? "partial" : "unpaid";

    const updatedInvoice = {
      ...invoice,
      payments: [...existingPayments, payment],
      depositPaid,
      balanceDue,
      paymentStatus,
      paidAt: paymentStatus === "paid" ? (invoice.paidAt || payment.paidAt) : invoice.paidAt || null,
      updatedAt: new Date().toISOString(),
    };

    await invoicesStore.setJSON(invoiceId, updatedInvoice);

    const indexRow = await invoicesIndexStore.get(invoiceId, { type: "json" });
    if (indexRow) {
      await invoicesIndexStore.setJSON(invoiceId, {
        ...indexRow,
        updatedAt: updatedInvoice.updatedAt,
        balanceDue: updatedInvoice.balanceDue,
        paymentStatus: updatedInvoice.paymentStatus,
      });
    }

    return json(200, {
      ok: true,
      invoiceId,
      payment,
      depositPaid: updatedInvoice.depositPaid,
      balanceDue: updatedInvoice.balanceDue,
      paymentStatus: updatedInvoice.paymentStatus,
    });
  } catch (err) {
    console.error("record-invoice-payment crashed:", err);
    return json(500, {
      error: "record-invoice-payment failed",
      message: err?.message || String(err),
    });
  }
};