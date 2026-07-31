const { getStore } = require("@netlify/blobs");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireAuth(context) {
  const user = context?.clientContext?.user;
  return user || null;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    const limit = Math.max(
      1,
      Math.min(500, Number(event.queryStringParameters?.limit || 100))
    );

    const indexStore = getStore("invoices_index", { siteID, token });
    const { blobs } = await indexStore.list({ limit });

    // These records are independent, so fetch them concurrently instead of
    // adding one network round trip to the response time for every invoice.
    const records = await Promise.all(
      blobs.map(async (blob) => {
        try {
          return await indexStore.get(blob.key, { type: "json" });
        } catch (err) {
          console.warn("Failed to parse invoice index record:", blob.key, err?.message);
          return null;
        }
      })
    );
    const items = records.filter(Boolean);

    items.sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return db - da;
    });

    return json(200, { items });
  } catch (err) {
    console.error("list-invoices crashed:", err);
    return json(500, {
      error: "list-invoices failed",
      message: err?.message || String(err),
    });
  }
};
