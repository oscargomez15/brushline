const { getStore } = require("@netlify/blobs");
const { randomUUID } = require("node:crypto");
const store = () => getStore("customer_activity", { siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN, consistency: "strong" });
async function recordActivity(customerId, details) {
  if (!customerId) return null;
  const event = { ...details, customerId, id: randomUUID(), at: new Date().toISOString() };
  const key = encodeURIComponent(customerId) + "/" + event.id;
  await store().setJSON(key, event);
  return { key, event };
}
async function safeActivity(customerId, details) {
  try { await recordActivity(customerId, details); return true; }
  catch (error) { console.error("Customer activity write failed", error); return false; }
}
function customerChanges(before, after) {
  return ["firstName", "lastName", "address", "unit", "email", "phone", "notes"]
    .filter(field => String(before?.[field] || "") !== String(after?.[field] || ""))
    .map(field => ({ field, before: String(before?.[field] || ""), after: String(after?.[field] || "") }));
}
// Record an attempt before sending; never turn a successful send into a retry because logging failed.
function trackEmail(client, meta) {
  return { emails: { send: async (payload) => {
    const entry = await recordActivity(meta.customerId, { ...meta, type: "email", status: "pending", recipient: payload.to, subject: payload.subject, actor: meta.actor || "System" });
    let result;
    try { result = await client.emails.send(payload); }
    catch (error) {
      if (entry) { try { await store().setJSON(entry.key, { ...entry.event, status: "unknown" }); } catch (logError) { console.error("Email activity update failed", logError); } }
      throw error;
    }
    if (entry) {
      try { await store().setJSON(entry.key, { ...entry.event, status: result?.error ? "failed" : "accepted", emailId: result?.data?.id || null }); }
      catch (error) { console.error("Email activity update failed; attempt remains pending", error); }
    }
    if (result?.error) throw new Error(result.error.message || "Email provider rejected the message");
    return result;
  } } };
}
module.exports = { recordActivity, safeActivity, customerChanges, trackEmail, activityStore: store };
