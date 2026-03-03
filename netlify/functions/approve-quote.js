const { getStore } = require("@netlify/blobs");

const sgMail = require("@sendgrid/mail");

function safeStr(v) {
  return (v || "").toString().trim();
}

function buildQuoteLink(baseUrl, id) {
  if (!baseUrl) return "";
  return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
}

async function sendApprovalEmail(updatedQuote, quoteId) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const to = process.env.APPROVAL_NOTIFY_TO;
  const from = process.env.APPROVAL_NOTIFY_FROM;

  if (!apiKey || !to || !from) {
    console.warn("SendGrid env vars missing; skipping approval email.");
    return;
  }

  sgMail.setApiKey(apiKey);

  const customerName =
    safeStr(updatedQuote?.clientName) ||
    safeStr(updatedQuote?.customer?.fullName) ||
    `${safeStr(updatedQuote?.customer?.firstName)} ${safeStr(updatedQuote?.customer?.lastName)}`.trim() ||
    "Client";

  const address =
    safeStr(updatedQuote?.projectAddress) ||
    safeStr(updatedQuote?.customer?.address) ||
    "N/A";

  const total = Number(updatedQuote?.grandTotal || 0);
  const deposit = Math.round(total * 0.4 * 100) / 100;

  const quoteNumber = updatedQuote?.quoteNumber || quoteId;
  const link = buildQuoteLink(process.env.PUBLIC_QUOTE_BASE_URL, quoteId);

  const subject = `✅ Quote Approved: ${customerName} (${quoteNumber})`;

  const textLines = [
    `A client has approved a quote.`,
    ``,
    `Client: ${customerName}`,
    `Address: ${address}`,
    `Quote #: ${quoteNumber}`,
    `Total: $${total.toFixed(2)}`,
    `Deposit (40%): $${deposit.toFixed(2)}`,
    `Approved at: ${updatedQuote?.approvedAt || "N/A"}`,
    updatedQuote?.signature?.typedName ? `Signed as: ${updatedQuote.signature.typedName}` : null,
    link ? `View quote: ${link}` : null,
  ].filter(Boolean);

  await sgMail.send({
    to,
    from,
    subject,
    text: textLines.join("\n"),
  });
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function dataUrlToBuffer(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) {
      return json(500, { error: "Missing Netlify env vars" });
    }

    const { id, signatureDataUrl, typedName } = JSON.parse(event.body || "{}");

    if (!id) return json(400, { error: "Missing quote id" });
    if (!signatureDataUrl) return json(400, { error: "Missing signature" });
    if (!typedName) return json(400, { error: "Missing typed name" });

    const pngBuffer = dataUrlToBuffer(signatureDataUrl);
    if (!pngBuffer || pngBuffer.length < 100) {
      return json(400, { error: "Invalid signature image" });
    }

    const quotes = getStore("quotes", { siteID, token });
    const index = getStore("quotes_index", { siteID, token });
    const signatures = getStore("quote_signatures", { siteID, token });

    const quote = await quotes.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // Prevent double approval
    if (quote.status === "approved") {
      return json(400, { error: "Quote already approved" });
    }

    const now = new Date().toISOString();
    const signatureKey = `${id}-${Date.now()}.png`;

    // Save signature image
    await signatures.set(signatureKey, pngBuffer, {
      contentType: "image/png",
      metadata: {
        typedName,
        signedAt: now,
      },
    });

    const signature = {
      key: signatureKey,
      typedName,
      signedAt: now,
      userAgent: event.headers["user-agent"] || null,
      ip: event.headers["x-nf-client-connection-ip"] || null,
    };

    const updatedQuote = {
      ...quote,
      status: "approved",
      approvedAt: now,
      signature,
    };

    await quotes.setJSON(id, updatedQuote);

    // 🔔 Email notify (don't block approval if email fails)
    sendApprovalEmail(updatedQuote, id).catch((e) =>
      console.error("sendApprovalEmail error:", e)
    );

    // Update index
    const idx = await index.get(id, { type: "json" });
    if (idx) {
      await index.setJSON(id, {
        ...idx,
        status: "approved",
        approvedAt: now,
        signature,
      });
    }

    return json(200, {
      ok: true,
      approvedAt: now,
      signature,
    });
  } catch (err) {
    console.error("approve-quote error:", err);
    return json(500, { error: "Server error" });
  }
};