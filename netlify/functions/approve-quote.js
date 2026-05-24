const { getStore } = require("@netlify/blobs");

const { Resend } = require("resend");

function safeStr(v) {
  return (v || "").toString().trim();
}

function buildQuoteLink(baseUrl, id) {
  if (!baseUrl) return "";
  return `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
}

async function sendApprovalEmail(updatedQuote, quoteId) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.APPROVAL_NOTIFY_TO;
  const from = process.env.APPROVAL_NOTIFY_FROM;

  console.log("Resend env check:", {
    hasApiKey: !!process.env.RESEND_API_KEY,
    to: process.env.APPROVAL_NOTIFY_TO ? "set" : "missing",
    from: process.env.APPROVAL_NOTIFY_FROM ? "set" : "missing",
  });

  if (!apiKey || !to || !from) {
    console.warn("Resend env vars missing; skipping approval email.");
    return;
  }

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
  const approvedAt = updatedQuote?.approvedAt
    ? new Date(updatedQuote.approvedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "N/A";

  const signedName = safeStr(updatedQuote?.signature?.typedName) || "N/A";
  const customerEmail = safeStr(updatedQuote?.email) || safeStr(updatedQuote?.customer?.email) || "N/A";
  const customerPhone = safeStr(updatedQuote?.phone) || safeStr(updatedQuote?.customer?.phone) || "N/A";
  const jobType = safeStr(updatedQuote?.jobType) || "N/A";

  const fmtMoney = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(n || 0));

  const subject = `✅ Quote Approved — ${customerName} (#${quoteNumber})`;

  const textLines = [
    `Congratulations! ${customerName} has approved their quote.`,
    ``,
    `Quote #: ${quoteNumber}`,
    `Job Type: ${jobType}`,
    `Project Address: ${address}`,
    `Customer Email: ${customerEmail}`,
    `Customer Phone: ${customerPhone}`,
    `Quote Total: ${fmtMoney(total)}`,
    `Deposit Due (40%): ${fmtMoney(deposit)}`,
    `Approved At: ${approvedAt}`,
    `Signed As: ${signedName}`,
    link ? `View Quote: ${link}` : null,
    ``,
    `Next step: follow up with the customer to collect the deposit and confirm scheduling.`,
  ].filter(Boolean);

  const html = `
  <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;padding:24px 16px;">
      <div style="background:#ffffff;border:1px solid rgba(15,23,42,.08);border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.08);">
        
        <div style="background:#0f172a;padding:24px 28px;">
          <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.65);font-weight:700;">
            Brushline Services CRM
          </div>
          <div style="margin-top:10px;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">
            Quote Approved 🎉
          </div>
          <div style="margin-top:8px;font-size:15px;line-height:1.6;color:rgba(255,255,255,.82);">
            Congratulations! <strong style="color:#ffffff;">${customerName}</strong> has approved their quote.
          </div>
        </div>

        <div style="padding:24px 28px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="padding:14px 16px;border-radius:14px;background:#f8fafc;border:1px solid rgba(15,23,42,.06);">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;">Quote #</div>
              <div style="margin-top:6px;font-size:16px;font-weight:800;color:#0f172a;">${quoteNumber}</div>
            </div>

            <div style="padding:14px 16px;border-radius:14px;background:#f8fafc;border:1px solid rgba(15,23,42,.06);">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;">Job Type</div>
              <div style="margin-top:6px;font-size:16px;font-weight:800;color:#0f172a;">${jobType}</div>
            </div>

            <div style="padding:14px 16px;border-radius:14px;background:#f8fafc;border:1px solid rgba(15,23,42,.06);">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;">Quote Total</div>
              <div style="margin-top:6px;font-size:16px;font-weight:800;color:#0f172a;">${fmtMoney(total)}</div>
            </div>

            <div style="padding:14px 16px;border-radius:14px;background:#ecfdf5;border:1px solid rgba(16,185,129,.18);">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#047857;">Deposit Due (40%)</div>
              <div style="margin-top:6px;font-size:16px;font-weight:800;color:#065f46;">${fmtMoney(deposit)}</div>
            </div>
          </div>

          <div style="margin-top:18px;padding:18px;border-radius:16px;background:#ffffff;border:1px solid rgba(15,23,42,.08);">
            <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:12px;">Approval Details</div>

            <div style="font-size:14px;line-height:1.7;color:#334155;">
              <div><strong>Customer:</strong> ${customerName}</div>
              <div><strong>Project Address:</strong> ${address}</div>
              <div><strong>Email:</strong> ${customerEmail}</div>
              <div><strong>Phone:</strong> ${customerPhone}</div>
              <div><strong>Approved At:</strong> ${approvedAt}</div>
              <div><strong>Signed As:</strong> ${signedName}</div>
            </div>
          </div>

          ${
            link
              ? `
          <div style="margin-top:22px;">
            <a
              href="${link}"
              style="display:inline-block;padding:14px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:700;"
            >
              Open Approved Quote
            </a>
          </div>
          `
              : ""
          }

          <div style="margin-top:22px;padding:16px 18px;border-radius:14px;background:#f8fafc;border:1px solid rgba(15,23,42,.06);">
            <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:6px;">
              Next Step
            </div>
            <div style="font-size:14px;line-height:1.6;color:#334155;">
              Reach out to the customer to collect the deposit, confirm the project schedule, and lock in the start date.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  const resend = new Resend(apiKey);

  await resend.emails.send({
    to,
    from,
    subject,
    text: textLines.join("\n"),
    html,
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

    const {
      id,
      signatureDataUrl,
      typedName,
      exteriorPaintSelection,
      exteriorExcludedAddOns = [],
    } = JSON.parse(event.body || "{}");

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

    if (quote.status === "approved") {
    return json(400, { error: "Quote already approved" });
    }
    let quoteToApprove = { ...quote };

    if (quote.jobType === "exterior") {

      const excludedIndexes = Array.isArray(exteriorExcludedAddOns)
        ? exteriorExcludedAddOns.map(Number)
        : [];

      // Put it RIGHT HERE
      let globalExtraIndex = 0;

      const updatedScopeItems = (quote.scopeItems || []).map((area) => ({
        ...area,

        extras: (area.extras || []).map((extra) => {
          const currentIndex = globalExtraIndex++;

          return {
            ...extra,
            excluded: excludedIndexes.includes(currentIndex),
          };
        }),
      }));

      // Then use it here
      quoteToApprove = {
        ...quoteToApprove,

        grandTotal: Number(
          exteriorPaintSelection?.updatedGrandTotal ||
          quote.grandTotal ||
          0
        ),

        paintAdjustment: Number(
          exteriorPaintSelection?.paintPriceDifference || 0
        ),

        exterior: {
          ...(quote.exterior || {}),

          ...(exteriorPaintSelection
            ? {
                paintType: exteriorPaintSelection.paintType,
                paintLabel: exteriorPaintSelection.paintLabel,
                paintPricePerGallon: Number(
                  exteriorPaintSelection.paintPricePerGallon || 0
                ),
                paintGallons: Number(
                  exteriorPaintSelection.paintGallons || 0
                ),
                paintMaterialCost: Number(
                  exteriorPaintSelection.paintMaterialCost || 0
                ),
                paintPriceDifference: Number(
                  exteriorPaintSelection.paintPriceDifference || 0
                ),

                excludedAddOns: excludedIndexes,
                excludedAddOnsTotal: Number(
                  exteriorPaintSelection.excludedAddOnsTotal || 0
                ),
              }
            : {}),

        },

        // Use it here
        scopeItems: updatedScopeItems,
      };
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
    
    const total = Number(quoteToApprove.grandTotal || 0);
    const depositPercent = Number(quote.depositPercent || 0.4);
    const depositRequired = Math.round(total * depositPercent * 100) / 100;

    const updatedQuote = {
      ...quoteToApprove,
      status: "approved",
      approvedAt: now,
      signature,
      depositPercent,
      depositRequired,
      depositPaid: quote.depositPaid || false,
      depositPaidAt: quote.depositPaidAt || null,
      depositCheckoutSessionId: quote.depositCheckoutSessionId || null,
      depositPaymentIntentId: quote.depositPaymentIntentId || null,
    };

    await quotes.setJSON(id, updatedQuote);

    // 🔔 Email notify (don't block approval if email fails)
    sendApprovalEmail(updatedQuote, id).catch((e) => {
      console.error(
        "sendApprovalEmail error:",
        e?.response?.body || e?.message || e
      );
    });

    // Update index
    const idx = await index.get(id, { type: "json" });
    if (idx) {
      await index.setJSON(id, {
        ...idx,
        status: "approved",
        approvedAt: now,
        signature,
        grandTotal: updatedQuote.grandTotal,
        paintAdjustment: updatedQuote.paintAdjustment || 0,
        exterior: updatedQuote.exterior || idx.exterior || null,
        scopeItems: updatedQuote.scopeItems || idx.scopeItems || [],
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