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

function safeStr(v) {
  return (v || "").toString().trim();
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "DELETE") {
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

    const id = safeStr(event.queryStringParameters?.id);
    if (!id) {
      return json(400, { error: "Missing invoice id" });
    }

    const invoicesStore = getStore("invoices", { siteID, token });
    const invoicesIndexStore = getStore("invoices_index", { siteID, token });

    const existing = await invoicesStore.get(id, { type: "json" });
    if (!existing) {
      return json(404, { error: "Invoice not found" });
    }

    await invoicesStore.delete(id);
    await invoicesIndexStore.delete(id);

    return json(200, { ok: true, id });
  } catch (err) {
    console.error("delete-invoice crashed:", err);
    return json(500, {
      error: "delete-invoice failed",
      message: err?.message || String(err),
    });
  }
};