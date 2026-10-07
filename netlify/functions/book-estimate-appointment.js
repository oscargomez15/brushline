const crypto = require("node:crypto");
const calendar = require("./_google-calendar");
const { POLICY, eligibleAddress, localDate, candidates } = require("./_appointment-policy");
const saveLead = require("./save-website-lead");

async function claim(store, key, value) {
  const previous = await store.getWithMetadata(key, { type: "json" });
  if (previous && previous.data.expires > Date.now()) return null;
  const result = await store.setJSON(key, value, previous ? { onlyIfMatch: previous.etag } : { onlyIfNew: true });
  return result.modified ? result.etag : null;
}
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return calendar.json(405, { error: "Method not allowed" });
  if (!calendar.sameSite(event)) return calendar.json(403, { error: "Invalid request origin" });
  if (Buffer.byteLength(event.body || "") > 100000) return calendar.json(413, { error: "Request is too large" });
  let input, session;
  try { input = JSON.parse(event.body || "{}"); session = calendar.bookingSession(input.bookingToken); }
  catch { return calendar.json(400, { error: "Invalid or expired booking session. Please restart the assistant." }); }
  let details = input.lead || {};
  if (input.confirmed !== true || !["fullName", "phone", "email", "address", "service"].every(key => typeof details[key] === "string" && details[key].trim() && details[key].length <= 1000) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) || !eligibleAddress(details.address)) {
    return calendar.json(400, { error: "Confirm your contact details and an address in our service area before booking." });
  }
  const store = calendar.store();
  const bookingKey = "booking/" + session.id;
  const sessionLockKey = "session-lock/" + session.id;
  let lockKey, lockEtag, sessionLockEtag;
  try {
    sessionLockEtag = await claim(store, sessionLockKey, { expires: Date.now() + 300000 });
    if (!sessionLockEtag) return calendar.json(409, { error: "Your appointment is already being confirmed. Please wait and retry." });
    const existing = await store.get(bookingKey, { type: "json" });
    if (existing?.status === "booked") {
      if (!existing.result.leadSaved) {
        try {
          const response = await saveLead.handler({ httpMethod: "POST", body: JSON.stringify(existing.lead) }, { appointmentBooking: existing.bookingContext });
          const recovered = JSON.parse(response.body);
          if (response.statusCode === 200 && recovered.id) {
            Object.assign(existing.result, { leadSaved: true, leadId: recovered.id, ownerEmailSent: recovered.emailSent });
            await store.setJSON(bookingKey, existing);
          }
        } catch { /* Calendar confirmation remains valid; CRM data is retained for recovery. */ }
      }
      return calendar.json(200, existing.result);
    }
    if (existing && existing.start !== input.start) return calendar.json(409, { error: "This appointment is being confirmed. Please retry the same time." });
    if (existing?.details) details = existing.details;
    const slot = candidates().find(value => value.start === input.start);
    // A retry can recover an event already created even if the notice window advanced.
    if (!slot && !existing) return calendar.json(400, { error: "This time is outside our booking window. Please select a new time." });
    const selected = existing?.slot || slot;
    lockKey = "day-lock/" + localDate(selected.start);
    lockEtag = await claim(store, lockKey, { expires: Date.now() + 300000, sessionId: session.id });
    if (!lockEtag) return calendar.json(409, { error: "Another appointment is being confirmed. Please wait a moment and try again." });
    const access = await calendar.accessToken();
    const eventId = crypto.createHash("sha256").update("brushline-estimate:" + session.id).digest("hex");
    const eventPath = "/calendars/" + encodeURIComponent(POLICY.calendarId) + "/events";
    let appointment;
    if (existing) {
      try { appointment = await calendar.api(eventPath + "/" + eventId, access); }
      catch (error) { if (error.status !== 404) throw error; }
    }
    if (!appointment) {
      const open = await calendar.availability(access);
      if (!open.some(value => value.start === selected.start)) return calendar.json(409, { error: "That time is no longer available. Please select another time.", refreshAvailability: true });
      await store.setJSON(bookingKey, { status: "pending", start: selected.start, slot: selected, eventId, details, transcript: existing?.transcript || input.transcript, createdAt: existing?.createdAt || new Date().toISOString() });
      appointment = await calendar.api(eventPath + "?sendUpdates=all", access, {
        method: "POST",
        body: JSON.stringify({
          id: eventId,
          summary: `Free estimate — ${details.fullName.trim().slice(0, 140)}`,
          location: details.address.trim().slice(0, 400),
          description: `Brushline Services free in-home estimate (45 minutes).\nService: ${details.service.slice(0, 300)}\nPhone: ${details.phone.slice(0, 60)}\nProject: ${String(details.projectDetails || "").slice(0, 3000)}\nCall (239) 777-3713 to change or cancel your visit.`,
          start: { dateTime: selected.start, timeZone: POLICY.timeZone },
          end: { dateTime: selected.end, timeZone: POLICY.timeZone },
          attendees: [{ email: details.email.trim() }],
          guestsCanInviteOthers: false,
          guestsCanModify: false,
          visibility: "private",
          transparency: "opaque",
          extendedProperties: { private: { source: "brushline_ai_assistant", bookingId: session.id } },
        }),
      });
    }
    if (appointment.status === "cancelled") return calendar.json(409, { error: "This appointment was cancelled. Please start a new booking." });
    const label = new Intl.DateTimeFormat("en-US", { timeZone: POLICY.timeZone, dateStyle: "full", timeStyle: "short" }).format(new Date(selected.start)) + " Eastern";
    const result = { appointmentBooked: true, start: selected.start, end: selected.end, timeZone: POLICY.timeZone, preferredAppointment: label, calendarEventId: eventId, leadSaved: false };
    const bookingContext = { id: session.id, appointment: { status: "booked", start: selected.start, end: selected.end, timeZone: POLICY.timeZone, calendarEventId: eventId } };
    const lead = { ...details, serviceAreaStatus: "eligible", preferredAppointment: label, transcript: existing?.transcript || input.transcript };
    const record = { status: "booked", start: selected.start, slot: selected, eventId, result, lead, bookingContext };
    // Persist confirmation before email/CRM work: retries must never create a second appointment.
    await store.setJSON(bookingKey, record);
    try {
      const response = await saveLead.handler({ httpMethod: "POST", body: JSON.stringify(lead) }, { appointmentBooking: bookingContext });
      const leadResult = JSON.parse(response.body);
      if (response.statusCode === 200 && leadResult.id) {
        Object.assign(result, { leadSaved: true, leadId: leadResult.id, ownerEmailSent: leadResult.emailSent });
        await store.setJSON(bookingKey, record);
      }
    } catch { console.error("Calendar appointment confirmed; CRM lead needs recovery", eventId); }
    return calendar.json(200, result);
  } catch { return calendar.json(503, { error: "We could not confirm the booking response. Retry the same time to check its status; do not choose a second appointment yet." }); }
  finally {
    if (lockKey && lockEtag) {
      try { await store.setJSON(lockKey, { expires: 0 }, { onlyIfMatch: lockEtag }); } catch { /* The lease expires automatically after five minutes. */ }
    }
    if (sessionLockEtag) {
      try { await store.setJSON(sessionLockKey, { expires: 0 }, { onlyIfMatch: sessionLockEtag }); } catch { /* Lease expiry permits recovery. */ }
    }
  }
};
