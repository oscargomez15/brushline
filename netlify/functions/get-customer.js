const { safeStr, requireAuth, getCustomersStore } = require("./_customers");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const id = safeStr(event.queryStringParameters?.id);
    if (!id) return json(400, { error: "Missing id" });

    const store = getCustomersStore();
    const customer = await store.get(id, { type: "json" });

    if (!customer) return json(404, { error: "Customer not found" });

    return json(200, { customer });
  } catch (e) {
    console.error("get-customer failed:", e);
    return json(500, { error: "get-customer failed", message: e?.message || String(e) });
  }
};