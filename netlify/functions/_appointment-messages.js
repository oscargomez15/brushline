const { Resend } = require("resend");
const OWNER_EMAIL = "oscargomez@brushlineservices.com";
const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
function payloads(record) {
  const lead = record.lead;
  const when = record.result.preferredAppointment;
  const rows = [["Appointment", when], ["Duration", "45 minutes"], ["Customer", lead.fullName], ["Service", lead.service], ["Project address", lead.address], ["Phone", lead.phone], ["Email", lead.email], ["Project details", lead.projectDetails || "Not provided"]];
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172338"><div style="background:#2563eb;padding:24px;text-align:center"><img src="https://brushlineservices.com/logo.png" alt="Brushline Services" width="180"/></div><div style="padding:24px"><h1 style="font-size:24px">Free estimate confirmed</h1><p>Your appointment details:</p><table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#64748b">${escape(label)}</td><td style="padding:10px;border-bottom:1px solid #e2e8f0">${escape(value)}</td></tr>`).join("")}</table><p>This is a free in-home estimate. To change or cancel your visit, call <a href="tel:+12397773713">(239) 777-3713</a> or reply to this email.</p></div></div>`;
  return [
    { kind: "client", to: lead.email, replyTo: OWNER_EMAIL, subject: "Your free estimate is booked — Brushline Services", text: `Hi ${lead.fullName},\nYour free estimate is confirmed.\n\n${text}\n\nTo change or cancel, call (239) 777-3713 or reply to this email.`, html },
    { kind: "owner", to: OWNER_EMAIL, replyTo: lead.email, subject: `New estimate booked: ${lead.fullName} — ${when}`, text: `A new free estimate was booked through the AI assistant.\n\n${text}\n\nView the lead: https://brushlineservices.com/crm/leads`, html: html.replace("Free estimate confirmed", "New free estimate booked") },
  ];
}
async function sendAppointmentMessages(store, bookingKey, record) {
  record.messages ||= {};
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.APPOINTMENT_NOTIFY_FROM || process.env.CONTACT_NOTIFY_FROM || process.env.APPROVAL_NOTIFY_FROM || process.env.QUOTE_NOTIFY_FROM;
  if (!apiKey || !from) { record.result.clientEmailSent = false; record.result.ownerEmailSent = false; await store.setJSON(bookingKey, record); return; }
  const resend = new Resend(apiKey);
  for (const { kind, ...payload } of payloads(record)) {
    const previous = record.messages[kind];
    if (previous?.status === "sent") continue;
    // A send whose response was lost may safely retry within Resend's 24-hour deduplication window.
    if (previous?.attemptedAt && Date.now() - Date.parse(previous.attemptedAt) >= 23 * 3600000) continue;
    const attemptedAt = previous?.attemptedAt || new Date().toISOString();
    record.messages[kind] = { status: "pending", attemptedAt };
    await store.setJSON(bookingKey, record);
    let timeout;
    try {
      const response = await Promise.race([
        resend.emails.send({ from, ...payload }, { idempotencyKey: `appointment-${kind}/${record.eventId}` }),
        new Promise((resolve, reject) => { timeout = setTimeout(() => reject(new Error("Appointment email response timed out")), 8000); }),
      ]);
      record.messages[kind] = { status: response.error ? "failed" : "sent", attemptedAt, emailId: response.data?.id || null };
      if (response.error) console.error("Appointment email was not accepted", kind, response.error.name);
    } catch { record.messages[kind] = { status: "uncertain", attemptedAt }; }
    finally { clearTimeout(timeout); }
    await store.setJSON(bookingKey, record);
  }
  record.result.clientEmailSent = record.messages.client?.status === "sent";
  record.result.ownerEmailSent = record.messages.owner?.status === "sent";
  await store.setJSON(bookingKey, record);
}
module.exports = { OWNER_EMAIL, payloads, sendAppointmentMessages };
