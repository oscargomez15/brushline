const { getStore } = require("@netlify/blobs");
const { buildQuotePdfBase64 } = require("./_pdf");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function safeStr(v) {
  return (v || "").toString().trim();
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

    const body = JSON.parse(event.body || "{}");
    const id = safeStr(body.id);

    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) {
      return json(500, { error: "Missing env vars for Blobs" });
    }

    const quotesStore = getStore("quotes", { siteID, token });
    const pdfsStore = getStore("quotes_pdfs", { siteID, token });

    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    const pdfBase64 = await buildQuotePdfBase64(quote);

    await pdfsStore.set(id, pdfBase64);

    return json(200, {
      ok: true,
      message: "PDF regenerated successfully",
      id,
    });
  } catch (e) {
    console.error("regenerate-quote-pdf failed:", e);
    return json(500, {
      error: "regenerate-quote-pdf failed",
      message: e?.message || String(e),
    });
  }
};