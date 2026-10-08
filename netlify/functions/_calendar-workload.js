const { POLICY, localDate, easternInstant } = require("./_appointment-policy");
function calendarWorkload(events, now = Date.now()) {
  const today = localDate(now);
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.parse(today + "T12:00:00Z") + index * 86400000);
    const day = date.toISOString().slice(0, 10);
    if ([0, 6].includes(date.getUTCDay())) return { day, status: "closed", label: "Closed" };
    const start = Date.parse(easternInstant(day, POLICY.openHour * 60));
    const end = Date.parse(easternInstant(day, POLICY.closeHour * 60));
    const buffer = POLICY.bufferMinutes * 60000;
    const intervals = events.filter(event => event.status !== "cancelled" && event.transparency !== "transparent" && !event.attendees?.some(attendee => attendee.self && attendee.responseStatus === "declined")).map(event => {
      if (event.start?.date) return day >= event.start.date && day < (event.end?.date || event.start.date) ? [start, end] : null;
      return [Math.max(start, Date.parse(event.start?.dateTime) - buffer), Math.min(end, Date.parse(event.end?.dateTime) + buffer)];
    }).filter(interval => interval && interval[1] > interval[0]).sort((a, b) => a[0] - b[0]);
    let cursor = start, blocked = 0, longestGap = 0;
    for (const [from, to] of intervals) {
      longestGap = Math.max(longestGap, from - cursor);
      blocked += Math.max(0, to - Math.max(cursor, from));
      cursor = Math.max(cursor, to);
    }
    longestGap = Math.max(longestGap, end - cursor);
    const status = longestGap < POLICY.durationMinutes * 60000 ? "full" : blocked >= (end - start) / 2 ? "partial" : "available";
    return { day, status, label: { full: "No availability", partial: "Half day or more busy", available: "Available" }[status], busyMinutes: Math.round(blocked / 60000) };
  });
}
module.exports = { calendarWorkload };
