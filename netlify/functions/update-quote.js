const { getStore } = require("@netlify/blobs");
const { DEFAULT_TERMS_TEXT, DEFAULT_TERMS_VERSION } = require("./_terms");
const { buildQuotePdfBase64 } = require("./_pdf");
const { getQuoteNumber } = require("./_quote-number");
const { Resend } = require("resend");

const PRICE_NOTIFICATION_WINDOW_MS = 15 * 60 * 1000;
const MAX_PRICE_NOTIFICATIONS_PER_WINDOW = 2;

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
  return context?.clientContext?.user || null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeStr(email));
}

function money(value) {
  return (Number(value) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function cents(value) {
  return Math.round((Number(value) || 0) * 100);
}

function collectPriceEntries(quote) {
  const entries = new Map();

  const add = (label, value, prefix = "") => {
    const cleanLabel = safeStr(label);
    if (!cleanLabel) return;
    const key = `${prefix}:${cleanLabel.toLowerCase()}`;
    entries.set(key, { label: cleanLabel, value: Number(value) || 0 });
  };

  (Array.isArray(quote?.lineItems) ? quote.lineItems : []).forEach((item) => {
    add(item?.title || item?.name, item?.price ?? item?.total, "item");
  });

  (Array.isArray(quote?.scopePackages) ? quote.scopePackages : []).forEach((pkg) => {
    add(pkg?.label || pkg?.key, pkg?.total, "package");
  });

  (Array.isArray(quote?.scopeItems) ? quote.scopeItems : []).forEach((scopeItem) => {
    (Array.isArray(scopeItem?.extras) ? scopeItem.extras : []).forEach((extra) => {
      add(extra?.label, extra?.price, "extra");
    });
  });

  return entries;
}

function getPriceChanges(before, after) {
  const changes = [];
  const oldTotal = Number(before?.grandTotal) || 0;
  const newTotal = Number(after?.grandTotal) || 0;

  const oldEntries = collectPriceEntries(before);
  const newEntries = collectPriceEntries(after);
  const keys = new Set([...oldEntries.keys(), ...newEntries.keys()]);

  keys.forEach((key) => {
    const oldEntry = oldEntries.get(key);
    const newEntry = newEntries.get(key);
    const oldValue = oldEntry?.value || 0;
    const newValue = newEntry?.value || 0;
    if (cents(oldValue) === cents(newValue)) return;

    const baseLabel = newEntry?.label || oldEntry?.label || "Price item";
    const changeType = !oldEntry ? "added" : !newEntry ? "removed" : "changed";

    changes.push({
      label: changeType === "changed" ? baseLabel : `${baseLabel} (${changeType})`,
      before: oldValue,
      after: newValue,
      changeType,
    });
  });

  // Use the overall total only when the changed component cannot be identified.
  // This avoids showing the same single price change twice under different labels.
  if (!changes.length && cents(oldTotal) !== cents(newTotal)) {
    changes.push({
      label: "Quote total",
      before: oldTotal,
      after: newTotal,
      changeType: "changed",
    });
  }

  return changes;
}

function buildPublicQuoteUrl(quote) {
  const publicBase = process.env.PUBLIC_QUOTE_BASE_URL;
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const base = publicBase || (siteUrl ? `${siteUrl.replace(/\/$/, "")}/quote` : "");
  if (!base || !quote?.viewToken) return "";
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(quote.id)}?t=${encodeURIComponent(quote.viewToken)}`;
}

function buildPriceUpdateEmail({ quote, changes, quoteUrl }) {
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
  const customerName =
    safeStr(quote?.customer?.firstName) ||
    safeStr(quote?.clientName).split(/\s+/)[0] ||
    "there";
  const visibleChanges = changes.slice(0, 8);
  const remainingCount = Math.max(0, changes.length - visibleChanges.length);
  const changeRows = visibleChanges.map((change) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-weight:700;">${safe(change.label)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#64748b;text-align:right;text-decoration:line-through;">${safe(money(change.before))}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-weight:800;text-align:right;">${safe(money(change.after))}</td>
    </tr>`).join("");

  const html = `
  <div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:#2563eb;border-bottom:5px solid #f4c928;padding:18px;text-align:center;">
        <img src="https://brushlineservices.com/logo.png" alt="Brushline Services" style="height:96px;width:auto;display:block;margin:0 auto;" />
      </div>
      <div style="padding:24px 22px;">
        <div style="font-size:13px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Quote updated</div>
        <h1 style="margin:8px 0 10px;font-size:22px;">Hi ${safe(customerName)}, your quote has been modified</h1>
        <p style="margin:0 0 18px;color:#475569;line-height:1.6;">We updated pricing in your quote. Here is a summary of what changed:</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr><th style="padding:8px;text-align:left;color:#64748b;">Item</th><th style="padding:8px;text-align:right;color:#64748b;">Previous</th><th style="padding:8px;text-align:right;color:#64748b;">Updated</th></tr></thead>
          <tbody>${changeRows}</tbody>
        </table>
        ${remainingCount ? `<p style="color:#64748b;font-size:12px;">Plus ${remainingCount} additional pricing change${remainingCount === 1 ? "" : "s"} shown in the detailed quote.</p>` : ""}
        <div style="text-align:center;margin:22px 0 8px;">
          <a href="${safe(quoteUrl)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:13px 18px;border-radius:12px;">View Detailed Quote</a>
        </div>
        <p style="margin:12px 0 0;text-align:center;color:#64748b;font-size:12px;">Questions about an update? Reply to this email and we will be happy to help.</p>
      </div>
    </div>
  </div>`;

  const textChanges = visibleChanges.map(
    (change) => `- ${change.label}: ${money(change.before)} -> ${money(change.after)}`
  );
  if (remainingCount) textChanges.push(`- Plus ${remainingCount} additional pricing change(s)`);

  const text = [
    `Hi ${customerName},`,
    "",
    "Your quote has been modified. Here is a summary of the pricing changes:",
    ...textChanges,
    "",
    `View Detailed Quote: ${quoteUrl}`,
    "",
    "Questions about an update? Reply to this email and we will be happy to help.",
  ].join("\n");

  return { html, text };
}

async function sendPriceUpdateEmail({ quote, changes, quoteUrl, pdfBase64 }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM;
  const to = safeStr(quote?.email || quote?.customer?.email);
  if (!apiKey || !from || !isValidEmail(to) || !quoteUrl) {
    throw new Error("Missing quote notification configuration, recipient, or public URL");
  }

  const { html, text } = buildPriceUpdateEmail({ quote, changes, quoteUrl });
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    subject: `Your quote was updated - ${safeStr(quote?.companyName) || "Brushline Services"}`,
    html,
    text,
    attachments: pdfBase64 ? [{
      filename: `Quote-${getQuoteNumber(quote)}.pdf`,
      content: Buffer.from(pdfBase64, "base64"),
    }] : [],
  });

  if (result?.error) {
    throw new Error(result.error.message || "Resend rejected the quote update email");
  }
}

exports.handler = async (event, context) => {
  try {
    if (!["POST", "PUT"].includes(event.httpMethod)) {
    return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, { error: "Missing env vars for Blobs" });
    }

    const quotesStore = getStore("quotes", { siteID, token });
    const indexStore = getStore("quotes_index", { siteID, token });
    const pdfStore = getStore("quotes_pdfs", { siteID, token });

    const payload = JSON.parse(event.body || "{}");
    const id = safeStr(payload.id);
    if (!id) return json(400, { error: "Missing quote id" });

    const existing = await quotesStore.get(id, { type: "json" });
    if (!existing) return json(404, { error: "Quote not found" });

    const baseCustomer = payload.customer || existing.customer || {};

    const normalizedCustomer = {
    firstName: safeStr(baseCustomer.firstName),
    lastName: safeStr(baseCustomer.lastName),
    fullName: `${safeStr(baseCustomer.firstName)} ${safeStr(baseCustomer.lastName)}`.trim(),
    address: safeStr(baseCustomer.address),
    unit: safeStr(baseCustomer.unit),
    email: safeStr(baseCustomer.email),
    phone: safeStr(baseCustomer.phone),
    };

    const updatedQuote = {
      ...existing,
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: { id: user.sub, email: user.email },

      customerId: safeStr(payload.customerId) || existing.customerId || null,
      customer: normalizedCustomer,
      clientName: normalizedCustomer.fullName,
      projectAddress: normalizedCustomer.unit
        ? `${normalizedCustomer.address}, ${normalizedCustomer.unit}`
        : normalizedCustomer.address,
      email: normalizedCustomer.email,
      phone: normalizedCustomer.phone,

      terms: payload.terms || existing.terms || DEFAULT_TERMS_TEXT,
      termsVersion: payload.termsVersion || existing.termsVersion || DEFAULT_TERMS_VERSION,

      // preserve approval unless you want edits to reset it
      status: existing.status,
      approvedAt: existing.approvedAt,
      signature: existing.signature,
      viewToken: existing.viewToken,
      viewedAt: existing.viewedAt,
      viewedBy: existing.viewedBy,
      estimatorData: payload.estimatorData || existing.estimatorData || null,
      grandTotal:
        payload.grandTotal != null
        ? payload.grandTotal
        : existing.grandTotal,
      exterior: payload.exterior || existing.exterior || null,
      exteriorScope: payload.exteriorScope || existing.exteriorScope || null,
    };

    const priceChanges = getPriceChanges(existing, updatedQuote);
    const now = Date.now();
    const recentNotificationHistory = (
      Array.isArray(existing.priceNotificationHistory)
        ? existing.priceNotificationHistory
        : []
    ).filter((timestamp) => {
      const sentAt = new Date(timestamp).getTime();
      return Number.isFinite(sentAt) && now - sentAt < PRICE_NOTIFICATION_WINDOW_MS;
    });
    const canNotifyPriceChange =
      priceChanges.length > 0 &&
      recentNotificationHistory.length < MAX_PRICE_NOTIFICATIONS_PER_WINDOW;

    updatedQuote.priceNotificationHistory = recentNotificationHistory;

    await quotesStore.setJSON(id, updatedQuote);

    await indexStore.setJSON(id, {
      id,
      customerId: updatedQuote.customerId,
      createdAt: updatedQuote.createdAt,
      updatedAt: updatedQuote.updatedAt,
      jobType: updatedQuote.jobType,
      grandTotal: updatedQuote.grandTotal,
      clientName: updatedQuote.clientName || "",
      projectAddress: updatedQuote.projectAddress || "",
      status: updatedQuote.status || "awaiting_approval",
      approvedAt: updatedQuote.approvedAt || null,
      exterior: updatedQuote.exterior || null,
      exteriorScope: updatedQuote.exteriorScope || null,
    });

    const pdfBase64 = await buildQuotePdfBase64(updatedQuote);
    await pdfStore.set(id, pdfBase64);

    let priceNotification = {
      sent: false,
      suppressed: priceChanges.length > 0 && !canNotifyPriceChange,
      changeCount: priceChanges.length,
    };

    if (canNotifyPriceChange) {
      try {
        await sendPriceUpdateEmail({
          quote: updatedQuote,
          changes: priceChanges,
          quoteUrl: buildPublicQuoteUrl(updatedQuote),
          pdfBase64,
        });

        const sentAt = new Date(now).toISOString();
        updatedQuote.priceNotificationHistory = [...recentNotificationHistory, sentAt];
        updatedQuote.lastPriceNotificationAt = sentAt;
        await quotesStore.setJSON(id, updatedQuote);
        priceNotification = { sent: true, suppressed: false, changeCount: priceChanges.length };
      } catch (emailError) {
        console.error("Price update notification failed:", emailError?.message || emailError);
        priceNotification.error = true;
      }
    }

    return json(200, { ok: true, id, url: `/quote/${id}`, priceNotification });
  } catch (err) {
    console.error("update-quote failed:", err);
    return json(500, { error: "update-quote failed", message: err?.message || String(err) });
  }
};
