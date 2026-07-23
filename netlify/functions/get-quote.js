const { getStore } = require("@netlify/blobs");
const { getQuoteNumber } = require("./_quote-number");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id;
    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    // ✅ IMPORTANT: configure store with siteID + token
    const store = getStore("quotes", { siteID, token });

    // ✅ IMPORTANT: read as JSON
    const quote = await store.get(id, { type: "json" });

    if (!quote) return json(404, { error: "Quote not found" });

    return json(200, { ...quote, quoteNumber: getQuoteNumber(quote) });
  } catch (err) {
    console.error("get-quote crashed:", err);
    return json(500, { error: "get-quote failed", message: err?.message || String(err) });
  }
};
