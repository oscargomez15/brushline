const calendar = require("./_google-calendar");
const { POLICY } = require("./_appointment-policy");
exports.handler = async (event) => {
  const redirect = (status) => ({ statusCode: 302, headers: { Location: calendar.config().origin + "/crm/calendar?connection=" + status, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "Set-Cookie": "brushline_calendar_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure" }, body: "" });
  if (event.httpMethod !== "GET") return calendar.json(405, { error: "Method not allowed" });
  if (!calendar.configured()) return calendar.json(503, { error: "Calendar setup is incomplete" });
  try {
    const { state, code, error } = event.queryStringParameters || {};
    const cookie = String(event.headers?.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("brushline_calendar_state="))?.split("=")[1];
    if (!state || !/^[a-f0-9]{64}$/.test(state) || state !== cookie) return redirect("invalid");
    const store = calendar.store();
    const saved = await store.getWithMetadata("oauth/" + state, { type: "json" });
    if (!saved || saved.data.used || saved.data.expires < Date.now()) return redirect("expired");
    const consumed = await store.setJSON("oauth/" + state, { ...saved.data, used: true }, { onlyIfMatch: saved.etag });
    if (!consumed.modified) return redirect("expired");
    if (error || !code) return redirect("cancelled");
    const tokens = await calendar.tokenRequest({ grant_type: "authorization_code", code, redirect_uri: calendar.config().redirectUri });
    const primary = await calendar.api("/calendars/primary", tokens.access_token);
    if (primary.id?.toLowerCase() !== POLICY.calendarId || !tokens.refresh_token) return redirect("wrong_account");
    if (!calendar.SCOPES.every(scope => tokens.scope?.split(" ").includes(scope))) return redirect("permissions");
    await store.setJSON("connection", { calendarId: POLICY.calendarId, connectedAt: new Date().toISOString(), tokens: calendar.encrypt({ refreshToken: tokens.refresh_token }) });
    return redirect("connected");
  } catch { return redirect("failed"); }
};
