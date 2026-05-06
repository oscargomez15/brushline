const { getStore } = require("@netlify/blobs");
const { buildQuotePdfBase64 } = require("./_pdf");

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function buildQuoteEmailHtml({ companyName, customerName, address, total, deposit, quoteUrl }) {
  const safe = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));

  const money = (n) => {
    const x = Number(n || 0);
    return x.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

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
          Quote Ready
        </div>
      </div>

      <div style="padding:22px 20px;">
        <h1 style="margin:0 0 8px;font-size:20px;line-height:1.25;letter-spacing:-.02em;">
          Hi ${safe(customerName || "there")}, your quote is ready
        </h1>

        <p style="margin:0 0 14px;color:rgba(15,23,42,.75);font-size:14px;line-height:1.6;">
          Thanks for the opportunity — you can view your proposal and approve it online using the button below.
        </p>

        <div style="background:rgba(15,23,42,.03);border:1px solid rgba(15,23,42,.08);border-radius:14px;padding:14px;margin:16px 0;">
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;">
            <div style="min-width:220px;">
              <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">
                Project Location
              </div>
              <div style="margin-top:6px;font-size:14px;font-weight:700;">
                ${safe(address || "N/A")}
              </div>
            </div>

            <div style="min-width:220px;text-align:right;">
              <div style="font-size:12px;font-weight:800;color:rgba(15,23,42,.60);text-transform:uppercase;letter-spacing:.08em;">
                Total
              </div>
              <div style="margin-top:6px;font-size:18px;font-weight:900;">
                ${money(total)}
              </div>

              <div style="margin-top:10px;font-size:12px;color:rgba(15,23,42,.70);">
                Deposit (40%): <strong>${money(deposit)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align:center;margin:18px 0 6px;">
          <a href="${safe(quoteUrl)}"
             style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 16px;border-radius:12px;">
            View &amp; Approve Quote
          </a>
        </div>

        <p style="margin:10px 0 0;text-align:center;font-size:12px;color:rgba(15,23,42,.60);">
          If the button doesn’t work, copy and paste this link:<br/>
          <span style="word-break:break-all;">${safe(quoteUrl)}</span>
        </p>
      </div>

      <div style="padding:14px 20px;border-top:1px solid rgba(15,23,42,.08);background:rgba(15,23,42,.02);">
        <div style="font-size:12px;color:rgba(15,23,42,.65);line-height:1.6;">
          Questions? Reply to this email and we’ll help you out.
        </div>
      </div>
    </div>
  </div>
</div>`;
}

async function sendQuoteEmail({ to, quote, publicUrl, pdfBase64 }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM;

  if (!apiKey || !from || !to) {
    throw new Error("Missing Resend configuration");
  }

  const customerName =
    safeStr(quote?.clientName) ||
    safeStr(quote?.customer?.fullName) ||
    "there";

  const address =
    safeStr(quote?.projectAddress) ||
    safeStr(quote?.customer?.address) ||
    "N/A";

  const total = Number(quote?.grandTotal || 0);
  const deposit = Math.round(total * 0.4 * 100) / 100;

  const subject = `Your quote is ready – ${safeStr(quote?.companyName) || "Brushline Services"}`;

  const text = [
    `Hi ${customerName},`,
    ``,
    `Thanks for the opportunity — your quote is ready.`,
    ``,
    `Total: $${total.toFixed(2)}`,
    `Deposit (40%): $${deposit.toFixed(2)}`,
    ``,
    publicUrl ? `View your quote here:\n${publicUrl}` : null,
    ``,
    `If you have any questions, just reply to this email.`,
  ].filter(Boolean).join("\n");

  const html = buildQuoteEmailHtml({
    companyName: quote?.companyName || "Brushline Services",
    customerName,
    address,
    total,
    deposit,
    quoteUrl: publicUrl,
  });

const resend = new Resend(apiKey);

await resend.emails.send({
  from,
  to,
  subject,
  text,
  html,
  attachments: pdfBase64
    ? [
        {
          filename: `Quote-${quote.quoteNumber || quote.id}.pdf`,
          content: Buffer.from(pdfBase64, "base64"),
        },
      ]
    : [],
});
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

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const quoteId = safeStr(body.quoteId);
    if (!quoteId) {
      return json(400, { error: "quoteId is required" });
    }

    const quotesStore = getStore("quotes", { siteID, token });
    const quote = await quotesStore.get(quoteId, { type: "json" });

    if (!quote) {
      return json(404, { error: "Quote not found" });
    }

    const recipient = safeStr(quote?.email || quote?.customer?.email);
    if (!recipient || !isValidEmail(recipient)) {
      return json(400, { error: "Quote does not have a valid customer email" });
    }

    const publicBase = process.env.PUBLIC_QUOTE_BASE_URL;
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;

    const base =
      publicBase ||
      (siteUrl ? `${siteUrl.replace(/\/$/, "")}/quote` : "");

    if (!base) {
      return json(500, { error: "Missing public quote base URL" });
    }

    const publicUrl = `${base.replace(/\/$/, "")}/${encodeURIComponent(quote.id)}`;
    const linkToSend = `${publicUrl}?t=${encodeURIComponent(quote.viewToken || "")}`;

    if (!quote.viewToken) {
      return json(400, { error: "Quote is missing a view token" });
    }

    const pdfBase64 = await buildQuotePdfBase64(quote);

    await sendQuoteEmail({
      to: recipient,
      quote,
      publicUrl: linkToSend,
      pdfBase64,
    });

    return json(200, {
      ok: true,
      sentTo: recipient,
    });
  } catch (err) {
    console.error("resend-quote-email crashed:", err);
    return json(500, {
      error: "resend-quote-email failed",
      message: err?.message || String(err),
    });
  }
};