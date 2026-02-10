// netlify/functions/get-quote.js
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
    const id = event.queryStringParameters?.id;
    if (!id) return json(400, { error: "Missing id" });

    const store = getStore("quotes");

    // ✅ Read JSON from Blobs
    const quote = await store.get(id, { type: "json" }); // <--- fix

    if (!quote) return json(404, { error: "Quote not found" });

    return json(200, quote);
  } catch (e) {
    console.error("get-quote crashed:", e);
    return json(500, { error: "Server error" });
  }
};
