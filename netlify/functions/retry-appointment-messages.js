const calendar = require("./_google-calendar");
const { sendAppointmentMessages } = require("./_appointment-messages");
const { updateDeliveryNotification } = require("./_crm-notifications");
exports.handler = async () => {
  if (!calendar.configured()) return { statusCode: 200, body: "Calendar not configured" };
  const store = calendar.store();
  let attempted = 0;
  for await (const page of store.list({ prefix: "booking/", paginate: true })) {
    for (const blob of page.blobs) {
      const record = await store.get(blob.key, { type: "json" });
      // Only new bookings with an explicit message outbox are eligible. Never email historical bookings.
      if (record?.status !== "booked" || !record.messages || (record.result.clientEmailSent && record.result.ownerEmailSent)) continue;
      const pending = ["client", "owner"].filter(kind => record.messages[kind]?.status !== "sent");
      if (pending.every(kind => record.messages[kind]?.attemptedAt && Date.now() - Date.parse(record.messages[kind].attemptedAt) >= 23 * 3600000)) continue;
      const lockKey = "session-lock/" + record.bookingContext.id;
      const lock = await store.getWithMetadata(lockKey, { type: "json" });
      if (lock?.data.expires > Date.now()) continue;
      const claimed = await store.setJSON(lockKey, { expires: Date.now() + 300000 }, lock ? { onlyIfMatch: lock.etag } : { onlyIfNew: true });
      if (!claimed.modified) continue;
      try {
        const current = await store.get(blob.key, { type: "json" });
        await sendAppointmentMessages(store, blob.key, current);
        await updateDeliveryNotification(current);
      } catch { console.error("Appointment message retry needs review", record.eventId); }
      finally { await store.setJSON(lockKey, { expires: 0 }, { onlyIfMatch: claimed.etag }); }
      if (++attempted >= 1) return { statusCode: 200, body: "Processed one message outbox" };
    }
  }
  return { statusCode: 200, body: `Processed ${attempted} message outboxes` };
};
