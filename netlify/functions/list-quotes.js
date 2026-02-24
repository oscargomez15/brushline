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
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, { error: "Missing env vars for Blobs" });
    }

    const indexStore = getStore("quotes_index", { siteID, token });

    // --- IMPORTANT ---
    // Many environments don’t support listing keys directly.
    // If your @netlify/blobs supports it, use indexStore.list().
    // If not, we’ll add a fallback approach below.

    if (typeof indexStore.list !== "function") {
      return json(500, {
        error:
          "This blobs client does not support list(). Use an index manifest approach (ask me and I’ll add it).",
      });
    }

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || "50", 10) || 50, 200);
    const cursor = event.queryStringParameters?.cursor || undefined;

    const result = await indexStore.list({ cursor, limit });

    // result: { blobs: [{ key }], cursor? }
    const rows = await Promise.all(
      (result.blobs || []).map(async (b) => indexStore.get(b.key, { type: "json" }))
    );

    // sort newest first
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log("has list:", typeof indexStore.list);

    return json(200, { items: rows, cursor: result.cursor || null });
  } catch (err) {
    console.error("list-quotes crashed:", err);
    return json(500, { error: "list-quotes failed", message: err?.message || String(err) });
  }
};