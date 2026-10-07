const {
  safeStr,
  requireAuth,
  getCustomersStore,
  listAllCustomers,
  normalizePhone,
} = require("./_customers");

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

    const q = safeStr(event.queryStringParameters?.q).toLowerCase();
    const limit = Math.min(Number(event.queryStringParameters?.limit) || 20, 100);

    const store = getCustomersStore();
    const all = await listAllCustomers(store);

    let items = all;

    if (q) {
      const qPhone = normalizePhone(q);

      items = all.filter((c) => {
        const matchesText = (c.searchText || "").includes(q);
        const matchesPhone = qPhone && (c.phoneDigits || "").includes(qPhone);
        return matchesText || matchesPhone;
      });
    }

    return json(200, {
      items: items.slice(0, limit),
    });
  } catch (e) {
    console.error("list-customers failed:", e);
    return json(500, { error: "list-customers failed", message: e?.message || String(e) });
  }
};