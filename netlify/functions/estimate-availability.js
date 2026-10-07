const calendar = require("./_google-calendar");
const { POLICY } = require("./_appointment-policy");
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return calendar.json(405, { error: "Method not allowed" });
  try { calendar.bookingSession(event.headers?.["x-booking-token"]); }
  catch { return calendar.json(401, { error: "Restart the assistant to check live availability." }); }
  try {
    const access = await calendar.accessToken();
    const slots = await calendar.availability(access);
    return calendar.json(200, { slots, policy: { timeZone: POLICY.timeZone, durationMinutes: POLICY.durationMinutes, noticeHours: POLICY.noticeHours } });
  } catch { return calendar.json(503, { error: "Online booking is temporarily unavailable. You can still request a visit through the assistant or call (239) 777-3713." }); }
};
