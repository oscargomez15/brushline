const { getLeadsStore } = require("./_leads");
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!context?.clientContext?.user?.sub) return json(401, { error: "Unauthorized" });
  let input;
  try { input = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
  if (typeof input.id !== "string" || !/^[a-zA-Z0-9_-]{1,200}$/.test(input.id)) return json(400, { error: "Invalid lead ID" });
  try {
    const store = getLeadsStore();
    const lead = await store.get(input.id, { type: "json" });
    if (!lead) return json(404, { error: "Lead not found" });
    if (!lead.deletedAt) await store.setJSON(input.id, { ...lead, deletedAt: new Date().toISOString(), deletedBy: context.clientContext.user.sub });
    return json(200, { ok: true });
  } catch { return json(500, { error: "Could not delete lead. Please retry." }); }
};
