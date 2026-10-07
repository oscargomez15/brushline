const calendar = require("./_google-calendar");
const { POLICY } = require("./_appointment-policy");
exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") return calendar.json(405, { error: "Method not allowed" });
  if (!calendar.owner(context)) return calendar.json(403, { error: "Sign in as the calendar owner to see appointments." });
  try {
    const connection = calendar.configured() ? await calendar.store().get("connection", { type: "json" }) : null;
    if (!connection) return calendar.json(200, { connected: false, appointments: [] });
    const start = new Date(), end = new Date(start.getTime() + 30 * 86400000);
    const access = await calendar.accessToken();
    const appointments = [];
    let pageToken;
    do {
      const query = new URLSearchParams({ timeMin: start.toISOString(), timeMax: end.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250", timeZone: POLICY.timeZone, ...(pageToken ? { pageToken } : {}) });
      const page = await calendar.api(`/calendars/${encodeURIComponent(POLICY.calendarId)}/events?${query}`, access);
      for (const item of page.items || []) {
        if (item.status === "cancelled" || !item.start) continue;
        const estimate = item.extendedProperties?.private?.source === "brushline_ai_assistant" || /\b(free estimate|free quote)\b/i.test(item.summary || "");
        const job = item.extendedProperties?.private?.appointmentType === "job" || /\b(job|painting|drywall|cleaning|installation)\b/i.test(item.summary || "");
        const privateEvent = item.visibility === "private";
        appointments.push({ id: item.id, title: privateEvent ? "Busy" : item.summary || "Appointment", start: item.start.dateTime || item.start.date, end: item.end?.dateTime || item.end?.date, allDay: Boolean(item.start.date), location: privateEvent ? "" : item.location || "", type: privateEvent ? "event" : estimate ? "estimate" : job ? "job" : "event", url: item.htmlLink });
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
    return calendar.json(200, { connected: true, appointments });
  } catch { return calendar.json(503, { error: "Appointments could not be loaded. Check your Google Calendar connection and try again." }); }
};
