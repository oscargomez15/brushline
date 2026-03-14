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

function buildInvoiceEmailHtml({ companyName, customerName, address, total, balanceDue, invoiceUrl, invoiceNumber, dueDate }) {
  const safe = (v) =>
    String(v ?? "").replace(/[&<>\"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    }[m]));

  return `
<div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;">
    <div style="background:#ffffff;border:1px solid rgba(15,23,42,.10);border-radius:16px;overflow:hidden;box-shadow:0 12px 34px rgba(15,23,42,.08);">

      <div style="background:#0f172a;padding:22px 20px;text-align:center;">
        <img
          src="https://brushlineservices.com/logo.png"
          alt="Brushline Services"
          style="height:120px;width:auto;display:block;margin:0 auto;"
        />
      </div>

      <div style="padding:14px 20px;border-bottom:1px solid rgba(15,23,42,.08);display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="font-size:16px;font-weight:700;color:rgba(15,23,42,.65);">
          Invoice Ready
        </div>
      </div>

      <div style="padding:22px 20px;">
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.25;letter-spacing:-.02em;">
          Hi ${safe(customerName || "there")}, your invoice is ready
        </h1>

        <p style="margin:0 0 14px;color:rgba(15,23,42,.75);font-size:14px;line-height:1.6;">
          Thank you for choosing ${safe(companyName || "Brushline Services")}. You can view your invoice using the button below.
        </p>

        <div style="background:rgba(15,23,42,.03);border:1px solid rgba(15,23,42,.08);border-radius:14px;padding:14px;margin:16px 0;">
          <div style="display:grid;gap:12px;">
            <div>
              <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">Invoice #</div>
              <div style="margin-top:6px;font-size:14px;font-weight:700;">${safe(invoiceNumber || "—")}</div>
            </div>

            <div>
              <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">Project Location</div>
              <div style="margin-top:6px;font-size:14px;font-weight:700;">${safe(address || "N/A")}</div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;">
              <div>
                <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">Total</div>
                <div style="margin-top:6px;font-size:18px;font-weight:900;">${safe(fmtMoney(total))}</div>
              </div>

              <div>
                <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">Balance Due</div>
                <div style="margin-top:6px;font-size:18px;font-weight:900;">${safe(fmtMoney(balanceDue))}</div>
              </div>

              <div>
                <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">Due Date</div>
                <div style="margin-top:6px;font-size:14px;font-weight:700;">${safe(dueDate || "Upon receipt")}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align:center;margin:18px 0 6px;">
          <a href="${safe(invoiceUrl)}"
             style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 16px;border-radius:12px;">
            View Invoice
          </a>
        </div>

        <p style="margin:10px 0 0;text-align:center;font-size:12px;color:rgba(15,23,42,.60);">
          If the button doesn’t work, copy and paste this link:<br/>
          <span style="word-break:break-all;">${safe(invoiceUrl)}</span>
        </p>
      </div>

      <div style="padding:14px 20px;border-top:1px solid rgba(15,23,42,.08);background:rgba(15,23,42,.02);">
        <div style="font-size:12px;color:rgba(15,23,42,.65);line-height:1.6;">
          Questions? Reply to this email and we’ll be happy to help.
        </div>
      </div>
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

    const updated = {
      ...invoice,
      sentAt: new Date().toISOString(),
      status: invoice.status === "draft" ? "sent" : invoice.status,
      updatedAt: new Date().toISOString(),
    };

    await invoicesStore.setJSON(invoice.id, updated);

    return json(200, { ok: true, sentTo: to });
  } catch (err) {
    console.error("send-invoice-email crashed:", err);
    return json(500, {
      error: "send-invoice-email failed",
      message: err?.message || String(err),
    });
  }
};