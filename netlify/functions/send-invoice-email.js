const { getStore } = require("@netlify/blobs");
const sgMail = require("@sendgrid/mail");

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

function buildInvoiceEmailHtml({
  companyName,
  customerName,
  address,
  total,
  balanceDue,
  invoiceUrl,
  invoiceNumber,
  dueDate,
}) {
  const safe = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));

  const money = (n) => {
    const x = Number(n || 0);
    return x.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  return `
<div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;">

    <div style="background:#ffffff;border:1px solid rgba(15,23,42,.08);border-radius:20px;overflow:hidden;box-shadow:0 14px 36px rgba(15,23,42,.08);">

      <!-- TOP BRAND BAR -->
      <div style="background:#071533;padding:28px 20px;text-align:center;">
        <img
          src="https://brushlineservices.com/logo.png"
          alt="Brushline Services"
          style="height:110px;width:auto;display:block;margin:0 auto;"
        />
      </div>

      <!-- EYEBROW -->
      <div style="padding:16px 20px;border-bottom:1px solid rgba(15,23,42,.08);background:#ffffff;">
        <div style="font-size:14px;font-weight:800;color:#6b7280;letter-spacing:.02em;">
          Invoice Ready
        </div>
      </div>

      <!-- MAIN BODY -->
      <div style="padding:28px 20px 24px;">
        <h1 style="margin:0 0 10px;font-size:32px;line-height:1.15;letter-spacing:-.03em;color:#0f172a;">
          Hi ${safe(customerName || "there")}, your invoice is ready
        </h1>

        <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#4b5563;">
          Thank you for choosing ${safe(companyName || "Brushline Services")}. You can review your invoice online using the button below.
        </p>

        <!-- SUMMARY CARD -->
        <div style="background:#f8fafc;border:1px solid rgba(15,23,42,.08);border-radius:18px;padding:18px 16px;margin:0 0 22px;">

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">
              Invoice #
            </div>
            <div style="font-size:22px;font-weight:900;color:#0f172a;line-height:1.2;">
              ${safe(invoiceNumber || "—")}
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">
              Project Location
            </div>
            <div style="font-size:16px;font-weight:700;color:#0f172a;line-height:1.5;">
              ${safe(address || "N/A")}
            </div>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="width:33.33%;padding:0 12px 0 0;">
                <div style="font-size:12px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">
                  Total
                </div>
                <div style="font-size:28px;font-weight:900;color:#0f172a;line-height:1.1;">
                  ${safe(money(total))}
                </div>
              </td>

              <td valign="top" style="width:33.33%;padding:0 12px 0 12px;">
                <div style="font-size:12px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">
                  Balance Due
                </div>
                <div style="font-size:28px;font-weight:900;color:#0f172a;line-height:1.1;">
                  ${safe(money(balanceDue))}
                </div>
              </td>

              <td valign="top" style="width:33.33%;padding:0 0 0 12px;">
                <div style="font-size:12px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">
                  Due Date
                </div>
                <div style="font-size:18px;font-weight:800;color:#0f172a;line-height:1.3;">
                  ${safe(dueDate || "Upon receipt")}
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align:center;margin:0 0 16px;">
          <a
            href="${safe(invoiceUrl)}"
            style="display:inline-block;background:#0b1633;color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;line-height:1;padding:16px 24px;border-radius:14px;">
            View Invoice
          </a>
        </div>

        <p style="margin:0;text-align:center;font-size:13px;line-height:1.6;color:#6b7280;">
          If the button doesn’t work, copy and paste this link:
        </p>

        <p style="margin:8px 0 0;text-align:center;font-size:13px;line-height:1.6;color:#2563eb;word-break:break-all;">
          ${safe(invoiceUrl)}
        </p>
      </div>

      <!-- FOOTER -->
      <div style="padding:16px 20px;border-top:1px solid rgba(15,23,42,.08);background:#fafafa;">
        <div style="font-size:13px;line-height:1.6;color:#6b7280;">
          Questions? Reply to this email and we’ll be happy to help.
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-top:14px;font-size:11px;color:#9ca3af;">
      © ${new Date().getFullYear()} ${safe(companyName || "Brushline Services")}. All rights reserved.
    </div>
  </div>
</div>`;
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
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.QUOTE_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM;
    const publicBase = process.env.PUBLIC_INVOICE_BASE_URL;
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;

    if (!siteID || !token) {
      return json(500, { error: "Missing Blobs env vars" });
    }

    if (!apiKey || !from) {
      return json(500, { error: "Missing SendGrid env vars" });
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const invoiceId = safeStr(body.invoiceId);
    if (!invoiceId) {
      return json(400, { error: "invoiceId is required" });
    }

    const invoicesStore = getStore("invoices", { siteID, token });
    const invoice = await invoicesStore.get(invoiceId, { type: "json" });

    if (!invoice) {
      return json(404, { error: "Invoice not found" });
    }

    const to = safeStr(invoice.email || invoice?.customer?.email);
    if (!to || !isValidEmail(to)) {
      return json(400, { error: "Invoice does not have a valid client email" });
    }

    if (!invoice.viewToken) {
      return json(400, { error: "Invoice is missing a view token" });
    }

    const base =
      publicBase ||
      (siteUrl ? `${siteUrl.replace(/\/$/, "")}/invoice` : "");

    if (!base) {
      return json(500, { error: "Missing public invoice base URL" });
    }

    const invoiceUrl = `${base.replace(/\/$/, "")}/${encodeURIComponent(invoice.id)}?t=${encodeURIComponent(invoice.viewToken)}`;

    sgMail.setApiKey(apiKey);

    const subject = `Invoice ${safeStr(invoice.invoiceNumber) || invoice.id} from ${safeStr(invoice.companyName) || "Brushline Services"}`;

    const text = [
      `Hi ${safeStr(invoice.clientName) || "there"},`,
      ``,
      `Your invoice is ready.`,
      `Invoice #: ${safeStr(invoice.invoiceNumber) || invoice.id}`,
      `Total: ${fmtMoney(invoice.grandTotal)}`,
      `Balance Due: ${fmtMoney(invoice.balanceDue)}`,
      invoice.dueDate ? `Due Date: ${safeStr(invoice.dueDate)}` : `Due Date: Upon receipt`,
      ``,
      `View your invoice here:`,
      invoiceUrl,
      ``,
      `Thank you,`,
      safeStr(invoice.companyName) || "Brushline Services",
    ].join("\n");

    const html = buildInvoiceEmailHtml({
      companyName: invoice.companyName || "Brushline Services",
      customerName: invoice.clientName || "there",
      address: invoice.projectAddress || "",
      total: invoice.grandTotal || 0,
      balanceDue: invoice.balanceDue || 0,
      invoiceUrl,
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      dueDate: invoice.dueDate || "Upon receipt",
    });

    await sgMail.send({
      to,
      from,
      subject,
      text,
      html,
    });

    const invoicesIndexStore = getStore("invoices_index", { siteID, token });

    const now = new Date().toISOString();

    const updated = {
    ...invoice,
    sentAt: now,
    status: invoice.status === "draft" ? "sent" : invoice.status || "sent",
    paymentStatus:
        Number(invoice.depositPaid || 0) >= Number(invoice.grandTotal || 0)
        ? "paid"
        : Number(invoice.depositPaid || 0) > 0
            ? "partial"
            : "unpaid",
    updatedAt: now,
    };

    await invoicesStore.setJSON(invoice.id, updated);

    const existingIndex = await invoicesIndexStore.get(invoice.id, { type: "json" });
    if (existingIndex) {
    await invoicesIndexStore.setJSON(invoice.id, {
        ...existingIndex,
        updatedAt: now,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        balanceDue: updated.balanceDue,
    });
    }

    return json(200, { ok: true, sentTo: to });
  } catch (err) {
    console.error("send-invoice-email crashed:", err);
    return json(500, {
      error: "send-invoice-email failed",
      message: err?.message || String(err),
    });
  }
};