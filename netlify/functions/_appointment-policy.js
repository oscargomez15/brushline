const POLICY = Object.freeze({ calendarId: "murdexchannel@gmail.com", timeZone: "America/New_York", durationMinutes: 45, bufferMinutes: 30, noticeHours: 24, windowDays: 30, openHour: 9, closeHour: 17 });
const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: POLICY.timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
function localDate(value) { return dateFormatter.format(new Date(value)); }
function easternInstant(day, minute) {
  const wall = Date.parse(`${day}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: POLICY.timeZone, timeZoneName: "shortOffset" }).formatToParts(new Date(wall));
  const offset = parts.find(part => part.type === "timeZoneName").value.match(/GMT([+-])(\d+)(?::(\d+))?/);
  const minutes = offset ? (offset[1] === "+" ? 1 : -1) * (Number(offset[2]) * 60 + Number(offset[3] || 0)) : 0;
  return new Date(wall - minutes * 60000).toISOString();
}
function candidates(now = Date.now()) {
  const today = localDate(now);
  const start = Date.parse(`${today}T12:00:00Z`);
  const slots = [];
  for (let index = 0; index < POLICY.windowDays; index++) {
    const date = new Date(start + index * 86400000);
    if ([0, 6].includes(date.getUTCDay())) continue;
    const day = date.toISOString().slice(0, 10);
    for (let minute = POLICY.openHour * 60; minute + POLICY.durationMinutes <= POLICY.closeHour * 60; minute += 15) {
      const slotStart = easternInstant(day, minute);
      if (Date.parse(slotStart) < now + POLICY.noticeHours * 3600000) continue;
      slots.push({ start: slotStart, end: new Date(Date.parse(slotStart) + POLICY.durationMinutes * 60000).toISOString(), date: day });
    }
  }
  return slots;
}
function availableSlots(busy, now = Date.now()) {
  return candidates(now).filter(slot => !busy.some(block => Date.parse(slot.start) < Date.parse(block.end) + POLICY.bufferMinutes * 60000 && Date.parse(slot.end) + POLICY.bufferMinutes * 60000 > Date.parse(block.start)));
}
function eligibleAddress(address) {
  const value = String(address || "").toLowerCase();
  if (/\b(labelle|lehigh acres|immokalee|ave maria|matlacha|everglades city|miami)\b/.test(value)) return false;
  return /\b(cape coral|fort myers|estero|bonita springs|naples)\b/.test(value);
}
module.exports = { POLICY, localDate, easternInstant, candidates, availableSlots, eligibleAddress };
