const { safeActivity } = require("./_customer-activity");
const { getStore } = require("@netlify/blobs");
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
exports.handler = async (event, context) => {
  if (!context?.clientContext?.user) return json(401, { error: "Unauthorized" });
  if (!["GET", "POST"].includes(event.httpMethod)) return json(405, { error: "Method not allowed" });
  let body;
  try { body = event.httpMethod === "GET" ? event.queryStringParameters || {} : JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid JSON" }); }
  if (typeof body.quoteId !== "string" || !body.quoteId.trim()) return json(400, { error: "Quote ID is required" });
  if (event.httpMethod === "POST" && (!["verbal", "declined", "paused", "stopped", "review"].includes(body.state) || typeof body.note !== "string" || body.note.length > 2000)) return json(400, { error: "Invalid settings" });
  try {
    const options = { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN };
    const quotes = getStore("quotes", options);
    const quote = await quotes.get(body.quoteId, { type: "json", consistency: "strong" });
    if (!quote) return json(404, { error: "Quote not found" });
    const store = getStore("quote_follow_up_settings", options);
    const previous = await store.get(body.quoteId, { type: "json", consistency: "strong" });
    if (event.httpMethod === "GET") return json(200, { settings: previous || { state: "review", note: "" } });
    const settings = { state: body.state, note: body.note.trim(), updatedAt: new Date().toISOString(), updatedBy: context.clientContext.user.sub };
    // Keep suppression separate from quote/index writes so edits and approvals cannot erase it.
    await store.setJSON(body.quoteId, settings);
    const activityRecorded = await safeActivity(quote.customerId, { type: "follow_up", title: "Follow-up status changed", documentId: quote.id, documentType: "quote", actor: context.clientContext.user.email || context.clientContext.user.sub, changes: [{ field: "Follow-up status", before: previous?.state || "review", after: settings.state }], note: settings.note });
    return json(200, { settings, activityRecorded });
  } catch (error) { console.error("Follow-up settings failed", error); return json(500, { error: "Could not save follow-up settings. Please retry." }); }
};
