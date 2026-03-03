const { getStore } = require("@netlify/blobs");
const { DEFAULT_TERMS_TEXT, DEFAULT_TERMS_VERSION } = require("./_terms");

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

async function sendQuoteEmail({ to, quote, publicUrl }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.QUOTE_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM;

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
    publicUrl ? `View & approve your quote here:\n${publicUrl}` : null,
    ``,
    `If you have any questions, just reply to this email.`,
  ].filter(Boolean).join("\n");

  await sgMail.send({
    to,
    from,
    subject,
    text,
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

    if (!jobType || !["interior", "exterior"].includes(jobType)) {
      return json(400, { error: "jobType must be 'interior' or 'exterior'" });
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
      address: safeStr(customer.address),
      email: safeStr(customer.email), // ✅ keep email
      fullName: `${safeStr(customer.firstName)} ${safeStr(customer.lastName)}`.trim(),
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

    const quote = {
      id,
      createdAt: new Date().toISOString(),
      createdBy: { id: user.sub, email: user.email },
      ...payload,
      customer: normalizedCustomer,
      clientName: normalizedCustomer.fullName,      // ✅ add
      projectAddress: normalizedCustomer.address,   // ✅ add
      grandTotal: totalNumber,
      terms: payload.terms || DEFAULT_TERMS_TEXT,
      termsVersion: payload.termsVersion || DEFAULT_TERMS_VERSION,
      status: payload.status || "awaiting_approval",
      approvedAt: null,
    };

    await store.setJSON(id, quote);
    await indexStore.setJSON(id, {
      id,
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
      const publicUrl = buildPublicQuoteLink(process.env.PUBLIC_QUOTE_BASE_URL, id);

      // fallback: if PUBLIC_QUOTE_BASE_URL not set, email the relative URL
      const linkToSend = publicUrl || `/quote/${id}`;

      if (normalizedCustomer.email && isValidEmail(normalizedCustomer.email)) {
        await sendQuoteEmail({
          to: normalizedCustomer.email,
          quote,
          publicUrl: linkToSend,
        });
      } else {
        console.warn("No valid customer email; skipping quote email.");
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
