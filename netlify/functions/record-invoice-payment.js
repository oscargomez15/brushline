const { getStore } = require("@netlify/blobs");
const { Resend } = require("resend");

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeStr(email));
}

function fmtMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function fmtDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Today"
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function prettyMethod(method) {
  const methods = {
    cash: "Cash",
    check: "Check",
    zelle: "Zelle",
    card: "Card",
    stripe: "Stripe",
    bank_transfer: "Bank transfer",
    other: "Other",
  };
  return methods[method] || "Payment";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function buildPaymentEmailHtml({ invoice, payment, invoiceUrl }) {
  const company = safeStr(invoice.companyName) || "Brushline Services";
  const customer = safeStr(invoice.clientName) || "there";
  const paidInFull = Number(invoice.balanceDue) <= 0;
  const statusMessage = paidInFull
    ? "This invoice is now paid in full. We truly appreciate your business."
    : `Your remaining balance is ${fmtMoney(invoice.balanceDue)}.`;

  return `
<div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;">
    <div style="background:#ffffff;border:1px solid rgba(15,23,42,.08);border-radius:20px;overflow:hidden;box-shadow:0 14px 36px rgba(15,23,42,.08);">
      <div style="background:#071533;padding:28px 20px;text-align:center;">
        <img src="https://brushlineservices.com/logo.png" alt="Brushline Services" style="height:110px;width:auto;display:block;margin:0 auto;" />
      </div>

      <div style="padding:16px 20px;border-bottom:1px solid rgba(15,23,42,.08);">
        <div style="font-size:14px;font-weight:800;color:#6b7280;letter-spacing:.02em;">Payment Received</div>
      </div>

      <div style="padding:28px 20px 24px;">
        <h1 style="margin:0 0 10px;font-size:32px;line-height:1.15;letter-spacing:-.03em;color:#0f172a;">
          Thank you for your payment, ${escapeHtml(customer)}!
        </h1>
        <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#4b5563;">
          We received your payment for invoice <strong>${escapeHtml(invoice.invoiceNumber || invoice.id)}</strong>. ${escapeHtml(statusMessage)}
        </p>

        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:18px;padding:20px 16px;margin:0 0 18px;text-align:center;">
          <div style="font-size:12px;font-weight:900;color:#047857;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;">Payment Received</div>
          <div style="font-size:38px;font-weight:900;color:#065f46;line-height:1.1;">${escapeHtml(fmtMoney(payment.amount))}</div>
          <div style="margin-top:8px;font-size:14px;color:#047857;">${escapeHtml(prettyMethod(payment.method))} &bull; ${escapeHtml(fmtDate(payment.paidAt))}</div>
        </div>

        <div style="background:#f8fafc;border:1px solid rgba(15,23,42,.08);border-radius:18px;padding:18px 16px;margin:0 0 22px;">
          <div style="font-size:12px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Invoice #</div>
          <div style="font-size:20px;font-weight:900;color:#0f172a;margin-bottom:16px;">${escapeHtml(invoice.invoiceNumber || invoice.id)}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="width:33.33%;padding-right:10px;">
                <div style="font-size:11px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Invoice Total</div>
                <div style="font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(fmtMoney(invoice.grandTotal))}</div>
              </td>
              <td valign="top" style="width:33.33%;padding:0 10px;">
                <div style="font-size:11px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Total Paid</div>
                <div style="font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(fmtMoney(invoice.depositPaid))}</div>
              </td>
              <td valign="top" style="width:33.33%;padding-left:10px;">
                <div style="font-size:11px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Balance Due</div>
                <div style="font-size:20px;font-weight:900;color:${paidInFull ? "#047857" : "#0f172a"};">${escapeHtml(fmtMoney(invoice.balanceDue))}</div>
              </td>
            </tr>
          </table>
          ${payment.note ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(15,23,42,.08);font-size:13px;color:#64748b;"><strong>Payment note:</strong> ${escapeHtml(payment.note)}</div>` : ""}
        </div>

        ${invoiceUrl ? `<div style="text-align:center;margin-bottom:16px;"><a href="${escapeHtml(invoiceUrl)}" style="display:inline-block;background:#0b1633;color:#fff;text-decoration:none;font-weight:900;font-size:16px;padding:16px 24px;border-radius:14px;">View Updated Invoice</a></div>` : ""}
        <p style="margin:0;text-align:center;font-size:13px;line-height:1.6;color:#6b7280;">Please keep this email as confirmation of your payment.</p>
      </div>

      <div style="padding:16px 20px;border-top:1px solid rgba(15,23,42,.08);background:#fafafa;">
        <div style="font-size:13px;line-height:1.6;color:#6b7280;">Questions about this payment? Reply to this email and we&rsquo;ll be happy to help.</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:14px;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} ${escapeHtml(company)}. All rights reserved.</div>
  </div>
</div>`;
}

async function sendPaymentReceipt(invoice, payment) {
  const to = safeStr(invoice.email || invoice?.customer?.email);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM;

  if (!isValidEmail(to)) return { sent: false, reason: "Invoice does not have a valid customer email" };
  if (!apiKey || !from) return { sent: false, reason: "Missing Resend configuration" };

  const publicBase = process.env.PUBLIC_INVOICE_BASE_URL;
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const base = publicBase || (siteUrl ? `${siteUrl.replace(/\/$/, "")}/invoice` : "");
  const invoiceUrl = base && invoice.viewToken
    ? `${base.replace(/\/$/, "")}/${encodeURIComponent(invoice.id)}?t=${encodeURIComponent(invoice.viewToken)}`
    : "";
  const paidInFull = Number(invoice.balanceDue) <= 0;
  const subject = paidInFull
    ? `Payment received — Invoice ${safeStr(invoice.invoiceNumber) || invoice.id} paid in full`
    : `Payment received — Invoice ${safeStr(invoice.invoiceNumber) || invoice.id}`;
  const text = [
    `Hi ${safeStr(invoice.clientName) || "there"},`,
    "",
    `Thank you! We received your ${fmtMoney(payment.amount)} payment for invoice ${safeStr(invoice.invoiceNumber) || invoice.id}.`,
    `Payment method: ${prettyMethod(payment.method)}`,
    `Payment date: ${fmtDate(payment.paidAt)}`,
    `Invoice total: ${fmtMoney(invoice.grandTotal)}`,
    `Total paid: ${fmtMoney(invoice.depositPaid)}`,
    `Remaining balance: ${fmtMoney(invoice.balanceDue)}`,
    payment.note ? `Payment note: ${payment.note}` : null,
    "",
    paidInFull ? "Your invoice is now paid in full." : "Thank you for your payment.",
    invoiceUrl ? `View your updated invoice: ${invoiceUrl}` : null,
    "",
    safeStr(invoice.companyName) || "Brushline Services",
  ].filter(Boolean).join("\n");

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
    html: buildPaymentEmailHtml({ invoice, payment, invoiceUrl }),
  });
  if (result?.error) throw new Error(result.error.message || "Resend rejected the payment receipt");
  return { sent: true, to, emailId: result?.data?.id || null };
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

    let receipt = { sent: false, reason: "Receipt email was not attempted" };
    try {
      receipt = await sendPaymentReceipt(updatedInvoice, payment);
    } catch (emailError) {
      receipt = { sent: false, reason: emailError?.message || String(emailError) };
      console.error("Payment recorded, but receipt email failed:", emailError);
    }

    return json(200, {
      ok: true,
      invoiceId,
      payment,
      depositPaid: updatedInvoice.depositPaid,
      balanceDue: updatedInvoice.balanceDue,
      paymentStatus: updatedInvoice.paymentStatus,
      emailSent: receipt.sent,
      emailSentTo: receipt.to || null,
      emailError: receipt.sent ? null : receipt.reason,
    });
  } catch (err) {
    console.error("record-invoice-payment crashed:", err);
    return json(500, {
      error: "record-invoice-payment failed",
      message: err?.message || String(err),
    });
  }
};
