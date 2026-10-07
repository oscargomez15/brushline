const { activityStore } = require("./_customer-activity");
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
exports.handler = async (event, context) => {
  if (!context?.clientContext?.user) return json(401, { error: "Unauthorized" });
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });
  const id = event.queryStringParameters?.customerId;
  if (!id) return json(400, { error: "Customer ID is required" });
  try {
    const store = activityStore();
    const { blobs } = await store.list({ prefix: encodeURIComponent(id) + "/" });
    const rows = [];
    for (let i = 0; i < blobs.length; i += 25) {
      rows.push(...await Promise.all(blobs.slice(i, i + 25).map(blob => store.get(blob.key, { type: "json" }))));
    }
    return json(200, { items: rows.filter(row => row?.customerId === id).sort((a,b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id)) });
  } catch (error) { console.error("Customer history read failed", error); return json(500, { error: "Could not load activity. Please retry." }); }
};
