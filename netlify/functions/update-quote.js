const { getStore } = require("@netlify/blobs");
const { DEFAULT_TERMS_TEXT, DEFAULT_TERMS_VERSION } = require("./_terms");
const { buildQuotePdfBase64 } = require("./_pdf");

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

    const normalizedCustomer = {
      firstName: safeStr(payload.customer?.firstName),
      lastName: safeStr(payload.customer?.lastName),
      fullName: `${safeStr(payload.customer?.firstName)} ${safeStr(payload.customer?.lastName)}`.trim(),
      address: safeStr(payload.customer?.address),
      unit: safeStr(payload.customer?.unit),
      email: safeStr(payload.customer?.email),
      phone: safeStr(payload.customer?.phone),
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
    };

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
    });

    const pdfBase64 = await buildQuotePdfBase64(updatedQuote);
    await pdfStore.set(id, pdfBase64);

    return json(200, { ok: true, id, url: `/quote/${id}` });
  } catch (err) {
    console.error("update-quote failed:", err);
    return json(500, { error: "update-quote failed", message: err?.message || String(err) });
  }
};