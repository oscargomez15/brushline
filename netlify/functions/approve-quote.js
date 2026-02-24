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
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const id = payload?.id;
    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });

    const store = getStore("quotes", { siteID, token });

    const quote = await store.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // If already approved, just return it
    if (quote.status === "approved") {
      return json(200, { ok: true, quote });
    }

    const updated = {
      ...quote,
      status: "approved",
      approvedAt: new Date().toISOString(),
    };

    await store.setJSON(id, updated);

    // ✅ if you have an index store, update it too
    const indexStore = getStore("quotes_index", { siteID, token });
    if (indexStore) {
      try {
        const existingIndex = await indexStore.get(id, { type: "json" });
        await indexStore.setJSON(id, {
          ...(existingIndex || {}),
          id,
          status: "approved",
          approvedAt: updated.approvedAt,
        });
      } catch {
        // ignore index errors so approval still works
      }
    }

    return json(200, { ok: true, quote: updated });
  } catch (err) {
    console.error("approve-quote crashed:", err);
    return json(500, { error: "approve-quote failed", message: err?.message || String(err) });
  }
};