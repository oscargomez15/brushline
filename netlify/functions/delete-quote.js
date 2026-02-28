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
    // You can allow either DELETE or POST—Netlify supports DELETE, but some setups prefer POST.
    if (event.httpMethod !== "DELETE" && event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, { error: "Missing env vars for Blobs" });
    }

    // accept id from querystring or JSON body
    const qsId = event.queryStringParameters?.id;
    let bodyId;
    try {
      if (event.body) bodyId = JSON.parse(event.body)?.id;
    } catch (_) {}

    const id = qsId || bodyId;
    if (!id) return json(400, { error: "Missing id" });

    const indexStore = getStore("quotes_index", { siteID, token });

    // Optional: check existence first (so you can return 404)
    const existing = await indexStore.get(id, { type: "json" });
    if (!existing) {
      return json(404, { error: "Estimate not found" });
    }

    await indexStore.delete(id);

    return json(200, { ok: true, deletedId: id });
  } catch (err) {
    console.error("delete-quote crashed:", err);
    return json(500, { error: "delete-quote failed", message: err?.message || String(err) });
  }
};