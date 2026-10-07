const { getLeadsStore, listAllLeads } = require("./_leads");
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });
  if (!context?.clientContext?.user) return json(401, { error: "Unauthorized" });
  try {
    const leads = await listAllLeads(getLeadsStore());
    return json(200, { leads, total: leads.length, newCount: leads.filter((lead) => lead.status === "new").length });
  } catch (error) {
    console.error("list-leads failed:", error);
    return json(500, { error: "Leads could not be loaded." });
  }
};
