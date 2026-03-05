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

function tokenMatches(quote, t) {
  return safeStr(quote.viewToken) && safeStr(quote.viewToken) === safeStr(t);
}

function requireAuth(context) {
  return context?.clientContext?.user || null;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const id = safeStr(event.queryStringParameters?.id);
    const t = safeStr(event.queryStringParameters?.t);
    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });

    const quotesStore = getStore("quotes", { siteID, token });
    const pdfsStore = getStore("quotes_pdfs", { siteID, token });

    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // auth
    if (t) {
      if (!tokenMatches(quote, t)) return json(403, { error: "Invalid token" });
    } else {
      const user = requireAuth(context);
      if (!user) return json(401, { error: "Unauthorized" });
    }

    // 1) Try stored PDF first (matches emailed)
    let pdfBase64 = await pdfsStore.get(id, { type: "text" });

    // 2) If missing, generate (new style), store, then return
    if (!pdfBase64) {
      pdfBase64 = await buildQuotePdfBase64(quote);
      await pdfsStore.set(id, pdfBase64);
    }

    const filename = `Quote-${quote.quoteNumber || quote.id}.pdf`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
      body: pdfBase64,
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error("quote-pdf failed:", e);
    return json(500, { error: "quote-pdf failed", message: e?.message || String(e) });
  }
};