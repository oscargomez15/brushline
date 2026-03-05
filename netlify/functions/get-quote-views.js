const { getStore } = require("@netlify/blobs");

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
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = safeStr(event.queryStringParameters?.id);
    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });

    const quotesStore = getStore("quotes", { siteID, token });
    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    const events = Array.isArray(quote.viewEvents) ? quote.viewEvents : [];

    // newest first
    events.sort((a, b) => (a?.at < b?.at ? 1 : -1));

    return json(200, {
      id,
      viewCount: Number(quote.viewCount) || events.length,
      lastViewedAt: quote.viewedAt || null,
      viewEvents: events,
    });
  } catch (e) {
    console.error("get-quote-views failed:", e);
    return json(500, { error: "get-quote-views failed", message: e?.message || String(e) });
  }
};