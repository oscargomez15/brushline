const crypto = require("node:crypto");
const calendar = require("./_google-calendar");
const { POLICY } = require("./_appointment-policy");
exports.handler = async (event, context) => {
  if (!calendar.owner(context)) return calendar.json(403, { error: "Sign in as the calendar owner to manage this connection." });
  if (!["GET", "POST"].includes(event.httpMethod)) return calendar.json(405, { error: "Method not allowed" });
  try {
    if (event.httpMethod === "GET") {
      const configured = calendar.configured();
      const connection = configured ? await calendar.store().get("connection", { type: "json" }) : null;
      return calendar.json(200, { configured, connected: Boolean(connection), connectedAt: connection?.connectedAt, policy: POLICY });
    }
    if (!calendar.sameSite(event)) return calendar.json(403, { error: "Invalid request origin" });
    if (!calendar.configured()) return calendar.json(503, { error: "Add the Google Calendar credentials in Netlify first. See the setup instructions." });
    const { action } = JSON.parse(event.body || "{}");
    if (action === "disconnect") {
      const connection = await calendar.store().get("connection", { type: "json" });
      if (connection) {
        const token = calendar.decrypt(connection.tokens).refreshToken;
        const response = await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }), signal: AbortSignal.timeout(15000) });
        if (!response.ok && response.status !== 400) throw new Error("Could not revoke Google authorization. Please retry.");
        await calendar.store().delete("connection");
      }
      return calendar.json(200, { disconnected: true });
    }
    if (action !== "connect") return calendar.json(400, { error: "Invalid action" });
    const state = crypto.randomBytes(32).toString("hex");
    const { clientId, redirectUri, origin } = calendar.config();
    await calendar.store().setJSON("oauth/" + state, { expires: Date.now() + 600000, used: false });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: calendar.SCOPES.join(" "), access_type: "offline", prompt: "consent", login_hint: POLICY.calendarId, state }).toString();
    const secure = origin.startsWith("https:") ? "; Secure" : "";
    return { ...calendar.json(200, { url: url.toString() }), headers: { ...calendar.json(200, {}).headers, "Set-Cookie": `brushline_calendar_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}` } };
  } catch { return calendar.json(500, { error: "Calendar connection could not be updated. Please retry." }); }
};
