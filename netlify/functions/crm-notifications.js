const { store, listRecords, notificationsFrom, notificationId } = require("./_crm-notifications");
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
exports.handler = async (event, context) => {
  const user = context?.clientContext?.user;
  if (!user?.sub) return json(401, { error: "Unauthorized" });
  if (!["GET", "POST"].includes(event.httpMethod)) return json(405, { error: "Method not allowed" });
  try {
    const prefix = notificationId(user.sub) + "/";
    const reads = store("crm_notification_reads");
    if (event.httpMethod === "POST") {
      let input; try { input = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid JSON" }); }
      if (!Array.isArray(input.ids) || input.ids.length > 200 || input.ids.some(id => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id))) return json(400, { error: "Invalid notification IDs" });
      await Promise.all(input.ids.map(id => reads.setJSON(prefix + id, { readAt: new Date().toISOString() }, { onlyIfNew: true })));
      return json(200, { ok: true });
    }
    const [leads, quotes, events] = await Promise.all([listRecords(store("website_leads")), listRecords(store("quotes_index")), listRecords(store("crm_notification_events"))]);
    const recent = notificationsFrom(leads, quotes, events).slice(0, 200);
    const items = await Promise.all(recent.map(async item => ({ ...item, read: Boolean(await reads.get(prefix + item.id, { type: "json" })) })));
    return json(200, { items, unreadCount: items.filter(item => !item.read).length });
  } catch { return json(500, { error: "Notifications could not be loaded. Please retry." }); }
};
