const { getStore } = require("@netlify/blobs");
const crypto = require("node:crypto");
function store(name) { return getStore({ name, siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN, consistency: "strong" }); }
const notificationId = value => crypto.createHash("sha256").update(value).digest("hex");
async function listRecords(source) {
  const records = [];
  for await (const page of source.list({ paginate: true })) {
    // Read in small batches rather than issuing unbounded parallel requests.
    for (let offset = 0; offset < page.blobs.length; offset += 25) records.push(...await Promise.all(page.blobs.slice(offset, offset + 25).map(blob => source.get(blob.key, { type: "json" }))));
  }
  return records.filter(Boolean);
}
function notificationsFrom(leads, quotes, events) {
  const items = [...events];
  for (const lead of leads) {
    items.push({ id: notificationId("lead:" + lead.id), type: "lead", title: "New lead", detail: `${lead.fullName || "Customer"} · ${lead.service || "Estimate request"}`, createdAt: lead.createdAt, href: "/crm/leads" });
    if (lead.appointment?.status === "booked") items.push({ id: notificationId("booking:" + lead.appointment.calendarEventId), type: "booking", title: "New estimate booked", detail: `${lead.fullName} · ${lead.preferredAppointment}`, createdAt: lead.createdAt, href: "/crm/leads" });
  }
  for (const quote of quotes) if (quote.approvedAt) items.push({ id: notificationId("quote-approved:" + quote.id), type: "approval", title: "Quote approved", detail: `${quote.clientName || "Customer"} · ${quote.quoteNumber || quote.id}`, createdAt: quote.approvedAt, href: "/crm/estimates/find" });
  const unique = new Map(items.filter(item => /^[a-f0-9]{64}$/.test(item.id) && Number.isFinite(Date.parse(item.createdAt)) && /^\/crm\//.test(item.href)).map(item => [item.id, item]));
  return [...unique.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
async function recordNotification(key, item) {
  try { await store("crm_notification_events").setJSON(notificationId(key), { ...item, id: notificationId(key) }, { onlyIfNew: true }); }
  catch { console.error("CRM notification needs recovery", key); }
}
async function recordContactLead(input, emailId) {
  try {
    const id = "lead_contact_" + notificationId(emailId);
    const now = new Date().toISOString();
    await store("website_leads").setJSON(id, { id, createdAt: now, updatedAt: now, status: "new", source: "Website contact form", fullName: input.name, email: input.email, phone: input.phone, address: input.address, service: input.service, projectDetails: input.message, ...(input.zip ? { zip: input.zip, projectType: input.projectType } : {}) }, { onlyIfNew: true });
  } catch { console.error("Contact delivered; CRM lead needs recovery", emailId); }
}
async function updateDeliveryNotification(record) {
  try {
    const id = notificationId("booking-email:" + record.eventId);
    const events = store("crm_notification_events");
    if (record.result.clientEmailSent && record.result.ownerEmailSent) await events.delete(id);
    else await events.setJSON(id, { id, type: "booking", title: "Appointment email needs attention", detail: `${record.lead.fullName} · Booking confirmed; ${record.result.clientEmailSent ? "owner" : record.result.ownerEmailSent ? "client" : "client and owner"} email pending`, createdAt: record.createdAt || new Date().toISOString(), href: "/crm/calendar" });
  } catch { console.error("Appointment email status notification unavailable", record.eventId); }
}
module.exports = { store, notificationId, listRecords, notificationsFrom, recordNotification, recordContactLead, updateDeliveryNotification };
