const { getStore } = require("@netlify/blobs");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing Netlify env vars" });

    const { id, sessionId } = JSON.parse(event.body || "{}");
    if (!id) return json(400, { error: "Missing id" });

    const quotes = getStore("quotes", { siteID, token });
    const index = getStore("quotes_index", { siteID, token });

    const quote = await quotes.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // Optional: basic dedupe per session (prevents refresh spam)
    // We'll store a tiny "seen" blob keyed by quote+session.
    if (sessionId) {
      const seenStore = getStore("quote_views", { siteID, token });
      const seenKey = `${id}:${sessionId}`;
      const already = await seenStore.get(seenKey);
      if (already) {
        return json(200, { ok: true, deduped: true });
      }
      await seenStore.set(seenKey, "1", { metadata: { createdAt: new Date().toISOString() } });
    }

    const now = new Date().toISOString();

    const updated = {
      ...quote,
      viewCount: (quote.viewCount || 0) + 1,
      firstViewedAt: quote.firstViewedAt || now,
      lastViewedAt: now,
    };

    await quotes.setJSON(id, updated);

    // keep index in sync so list-quotes can show viewed status fast
    const idx = await index.get(id, { type: "json" });
    if (idx) {
      await index.setJSON(id, {
        ...idx,
        viewCount: updated.viewCount,
        firstViewedAt: updated.firstViewedAt,
        lastViewedAt: updated.lastViewedAt,
        viewed: true,
      });
    }

    return json(200, { ok: true, lastViewedAt: now, viewCount: updated.viewCount });
  } catch (err) {
    console.error("track-quote-view error", err);
    return json(500, { error: "Server error" });
  }
};