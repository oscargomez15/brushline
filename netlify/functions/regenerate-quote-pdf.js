const { getStore } = require("@netlify/blobs");
const { buildQuotePdfBase64 } = require("./create-quote"); // reuse your generator

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
    if (event.httpMethod !== "POST")
      return json(405, { error: "Method not allowed" });

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const { id } = JSON.parse(event.body || "{}");
    if (!id) return json(400, { error: "Missing quote id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    const quotesStore = getStore("quotes", { siteID, token });
    const pdfStore = getStore("quotes_pdfs", { siteID, token });

    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // regenerate PDF with latest styling
    const pdfBase64 = await buildQuotePdfBase64(quote);

    await pdfStore.set(id, pdfBase64);

    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Failed to regenerate PDF" });
  }
};