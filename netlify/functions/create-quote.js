const { getStore } = require("@netlify/blobs");
const { DEFAULT_TERMS_TEXT, DEFAULT_TERMS_VERSION } = require("./_terms");
const { buildQuotePdfBase64 } = require("./_pdf");

const sgMail = require("@sendgrid/mail");

function safeStr(v) {
  return (v || "").toString().trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function buildPublicQuoteLink(baseUrl, id) {
  if (!baseUrl) return "";
  return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
}

function buildQuoteEmailHtml({ companyName, customerName, address, total, deposit, quoteUrl }) {
  const safe = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));

  const money = (n) => {
    const x = Number(n || 0);
    return x.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  return `
<div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:680px;margin:0 auto;">

    <div style="background:#ffffff;border:1px solid rgba(15,23,42,.10);border-radius:16px;overflow:hidden;box-shadow:0 12px 34px rgba(15,23,42,.08);">

      <!-- LOGO BAR (full width) -->
      <div style="background:#0f172a;padding:22px 20px;text-align:center;">
        <img
          src="https://brushlineservices.com/logo.png"
          alt="Brushline Services"
          style="height:120px;width:auto;display:block;margin:0 auto;"
        />
      </div>

      <!-- HEADER ROW -->
      <div style="padding:14px 20px;border-bottom:1px solid rgba(15,23,42,.08);display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="font-size:16px;font-weight:700;color:rgba(15,23,42,.65);">
          Quote Ready
        </div>
      </div>

      <!-- BODY -->
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

      <!-- FOOTER -->
      <div style="padding:14px 20px;border-top:1px solid rgba(15,23,42,.08);background:rgba(15,23,42,.02);">
        <div style="font-size:12px;color:rgba(15,23,42,.65);line-height:1.6;">
          Questions? Reply to this email and we’ll help you out.
        </div>
      </div>

    </div>

    <div style="text-align:center;margin-top:14px;font-size:11px;color:rgba(15,23,42,.55);">
      © ${new Date().getFullYear()} ${safe(companyName)}. All rights reserved.
    </div>

  </div>
</div>`;
}

async function sendQuoteEmail({ to, quote, publicUrl, pdfBase64 }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.QUOTE_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM;
  const address =
    safeStr(quote?.projectAddress) ||
    safeStr(quote?.customer?.address) ||
    safeStr(quote?.address) ||
    "N/A";

  if (!apiKey || !from || !to) {
    console.warn("SendGrid env vars missing; skipping quote email.", {
      hasApiKey: !!apiKey,
      hasFrom: !!from,
      hasTo: !!to,
    });
    return;
  }

  sgMail.setApiKey(apiKey);

  const customerName =
    safeStr(quote?.clientName) ||
    safeStr(quote?.customer?.fullName) ||
    "there";

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

  await sgMail.send({
    to,
    from,
    subject,
    text,
    html,
    ...(pdfBase64
      ? {
          attachments: [
            {
              content: pdfBase64,
              filename: `Quote-${quote.quoteNumber || quote.id}.pdf`,
              type: "application/pdf",
              disposition: "attachment",
            },
          ],
        }
      : {}),
  });
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

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    // ✅ Auth
    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    // ✅ Env vars (must be inside handler)
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    // ✅ Store configured with siteID/token
    const store = getStore("quotes", { siteID, token });
    const indexStore = getStore("quotes_index", { siteID, token });

    // ✅ Parse body
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    // ✅ Validate
    const { jobType, grandTotal, customer } = payload;

    if (
      !customer ||
      typeof customer !== "object" ||
      !String(customer.firstName || "").trim() ||
      !String(customer.lastName || "").trim() ||
      !String(customer.address || "").trim()
    ) {
      return json(400, {
        error: "Missing customer info in request payload",
        receivedCustomer: customer ?? null,
        receivedKeys: Object.keys(payload || {}),
      });
    }

    if (!jobType || !["interior", "exterior", "handyman"].includes(jobType)) {
      return json(400, { error: "jobType must be 'interior', 'exterior', or 'handyman'" });
    }

    if (
      !customer ||
      typeof customer !== "object" ||
      !String(customer.firstName || "").trim() ||
      !String(customer.lastName || "").trim() ||
      !String(customer.address || "").trim()
    ) {
      return json(400, { error: "customer must include firstName, lastName, and address" });
    }

    const normalizedCustomer = {
      firstName: safeStr(customer.firstName),
      lastName: safeStr(customer.lastName),
      fullName: `${safeStr(customer.firstName)} ${safeStr(customer.lastName)}`.trim(),
      address: safeStr(customer.address),
      unit: safeStr(customer.unit),
      email: safeStr(customer.email),
      phone: safeStr(customer.phone),
    };

    if (normalizedCustomer.email && !isValidEmail(normalizedCustomer.email)) {
      return json(400, { error: "Invalid customer email" });
    }

    // NOTE: if grandTotal is coming as a string from the UI,
    // parse it before validation:
    const totalNumber = typeof grandTotal === "string" ? parseFloat(grandTotal) : grandTotal;

    if (!Number.isFinite(totalNumber)) {
      return json(400, { error: "grandTotal must be a number" });
    }

    const id = makeId();
    const viewToken = Math.random().toString(36).slice(2) + Date.now().toString(36);

    const quote = {
      id,
      createdAt: new Date().toISOString(),
      createdBy: { id: user.sub, email: user.email },
      ...payload,

      customerId: safeStr(payload.customerId) || null,
      customer: normalizedCustomer,

      clientName: normalizedCustomer.fullName,
      projectAddress: normalizedCustomer.unit
        ? `${normalizedCustomer.address}, ${normalizedCustomer.unit}`
        : normalizedCustomer.address,
      email: normalizedCustomer.email,
      phone: normalizedCustomer.phone,

      grandTotal: totalNumber,
      terms: payload.terms || DEFAULT_TERMS_TEXT,
      termsVersion: payload.termsVersion || DEFAULT_TERMS_VERSION,
      status: payload.status || "awaiting_approval",
      approvedAt: null,
      viewToken,
      viewedAt: null,
      viewedBy: null,
      estimatorData: payload.estimatorData || null,
    };

    await store.setJSON(id, quote);

    await indexStore.setJSON(id, {
      id,
      customerId: quote.customerId,
      createdAt: quote.createdAt,
      jobType: quote.jobType,
      grandTotal: quote.grandTotal,
      clientName: quote.clientName || quote.customer?.fullName || "",
      projectAddress: quote.projectAddress || quote.customer?.address || "",
      status: payload.status || "awaiting_approval",
      approvedAt: null,
    });

    // ✅ Email the customer the quote link (do not fail quote creation if email fails)
    try {

      // fallback: if PUBLIC_QUOTE_BASE_URL not set, email the relative URL
     const publicBase = process.env.PUBLIC_QUOTE_BASE_URL;  // e.g. https://brushlineservices.com/quote
      const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL; // Netlify fallbacks

      const base =
        publicBase ||
        (siteUrl ? `${siteUrl.replace(/\/$/, "")}/quote` : "");

      const publicUrl = base ? `${base.replace(/\/$/, "")}/${encodeURIComponent(id)}` : "";

      // ✅ tokenized customer link
      const linkToSend = publicUrl ? `${publicUrl}?t=${encodeURIComponent(viewToken)}` : "";
    
      const pdfBase64 = await buildQuotePdfBase64(quote);
      const pdfStore = getStore("quotes_pdfs", { siteID, token });
      await pdfStore.set(id, pdfBase64); // store the base64 string

    if (normalizedCustomer.email && isValidEmail(normalizedCustomer.email) && linkToSend) {
      await sendQuoteEmail({
        to: normalizedCustomer.email,
        quote,
        publicUrl: linkToSend,
        pdfBase64
      });
    } else {
      console.warn("No valid customer email or no public URL; skipping quote email.", {
        hasEmail: !!normalizedCustomer.email,
        hasLink: !!linkToSend,
      });
    }
    } catch (e) {
      console.error("sendQuoteEmail failed:", e?.response?.body || e?.message || e);
    }

    return json(200, { id, url: `/quote/${id}` });
  } catch (err) {
    console.error("create-quote crashed:", err);
    return json(500, { error: "create-quote failed", message: err?.message || String(err) });
  }
};
