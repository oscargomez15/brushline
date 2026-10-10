const calendar = require("./_google-calendar");
const { POLICY, localDate, easternInstant } = require("./_appointment-policy");
const { calendarWorkload } = require("./_calendar-workload");
exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") return calendar.json(405, { error: "Method not allowed" });
  if (!calendar.owner(context)) return calendar.json(403, { error: "Sign in as the calendar owner to see appointments." });
  try {
    const connection = calendar.configured() ? await calendar.store().get("connection", { type: "json" }) : null;
    if (!connection) return calendar.json(200, { connected: false, appointments: [] });
    const now = Date.now();
    const start = new Date(easternInstant(localDate(now), 0)), end = new Date(start.getTime() + 31 * 86400000);
    const access = await calendar.accessToken();
    const appointments = [];
    const calendarEvents = [];
    let pageToken;
    do {
      const query = new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250", timeZone: POLICY.timeZone, ...(pageToken ? { pageToken } : {}) });
      const page = await calendar.api(`/calendars/${encodeURIComponent(POLICY.calendarId)}/events?${query}`, access);
      for (const item of page.items || []) {
        calendarEvents.push(item);
        if (item.status === "cancelled" || !item.start) continue;
        if (Date.parse(item.end?.dateTime || (item.end?.date ? easternInstant(item.end.date, 0) : "")) <= now) continue;
        const estimate = item.extendedProperties?.private?.source === "brushline_ai_assistant" || /\b(free estimate|free quote)\b/i.test(item.summary || "");
        const job = item.extendedProperties?.private?.appointmentType === "job" || /\b(job|painting|drywall|cleaning|installation)\b/i.test(item.summary || "");
        const privateEvent = item.visibility === "private";
        appointments.push({ id: item.id, title: privateEvent ? "Busy" : item.summary || "Appointment", start: item.start.dateTime || item.start.date, end: item.end?.dateTime || item.end?.date, allDay: Boolean(item.start.date), location: privateEvent ? "" : item.location || "", type: privateEvent ? "event" : estimate ? "estimate" : job ? "job" : "event", url: item.htmlLink });
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
    // Use the same Google free/busy query and policy as client booking.
    let slots = null;
    try { slots = await calendar.availability(access, now); } catch { /* Keep the agenda usable if free/busy is unavailable. */ }
    return calendar.json(200, { connected: true, appointments, slots, days: calendarWorkload(calendarEvents, now) });
  } catch { return calendar.json(503, { error: "Appointments could not be loaded. Check your Google Calendar connection and try again." }); }
};
