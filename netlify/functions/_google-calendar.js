const crypto = require("node:crypto");
const { getStore } = require("@netlify/blobs");
const { POLICY, candidates, availableSlots } = require("./_appointment-policy");
const SCOPES = ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.freebusy", "https://www.googleapis.com/auth/calendar.calendars.readonly"];
const CALLBACK = "/.netlify/functions/google-calendar-callback";
const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
function config() {
  const key = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY || "";
  const origin = process.env.GOOGLE_CALENDAR_SITE_URL || "https://brushlineservices.com";
  if (!/^[a-f0-9]{64}$/i.test(key) || !process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET) throw new Error("Calendar setup is incomplete");
  const url = new URL(origin);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Invalid calendar site URL");
  return { key: Buffer.from(key, "hex"), origin: url.origin, redirectUri: url.origin + CALLBACK, clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID, clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET };
}
function configured() { try { config(); return true; } catch { return false; } }
function store() { return getStore({ name: "google_calendar_private", siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN, consistency: "strong" }); }
function owner(context) { return context?.clientContext?.user?.email?.toLowerCase() === POLICY.calendarId; }
function sameSite(event) {
  try { return new URL(event.headers?.origin || "").origin === config().origin; } catch { return false; }
}
function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", config().key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}
function decrypt(value) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", config().key, Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.data, "base64")), decipher.final()]).toString("utf8"));
}
function issueBookingToken() {
  const payload = Buffer.from(JSON.stringify({ id: crypto.randomUUID(), expires: Date.now() + 3600000 })).toString("base64url");
  return payload + "." + crypto.createHmac("sha256", config().key).update(payload).digest("base64url");
}
function bookingSession(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature || payload.length > 400) throw new Error("Invalid booking session");
  const expected = crypto.createHmac("sha256", config().key).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error("Invalid booking session");
  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (session.expires < Date.now()) throw new Error("Your booking session expired. Please restart the assistant.");
  return session;
}
async function tokenRequest(params) {
  const { clientId, clientSecret } = config();
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }), signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok) throw new Error("Google Calendar authorization needs to be reconnected");
  return data;
}
async function accessToken() {
  const saved = await store().get("connection", { type: "json" });
  if (!saved) throw new Error("Google Calendar is not connected yet");
  const tokens = decrypt(saved.tokens);
  return (await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refreshToken })).access_token;
}
async function api(path, access, options = {}) {
  const response = await fetch("https://www.googleapis.com/calendar/v3" + path, { ...options, headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error("Google Calendar is temporarily unavailable"); error.status = response.status; throw error; }
  return data;
}
async function availability(access, now = Date.now()) {
  const slots = candidates(now);
  const data = await api("/freeBusy", access, { method: "POST", body: JSON.stringify({ timeMin: new Date(Date.parse(slots[0].start) - POLICY.bufferMinutes * 60000).toISOString(), timeMax: new Date(Date.parse(slots[slots.length - 1].end) + POLICY.bufferMinutes * 60000).toISOString(), timeZone: POLICY.timeZone, items: [{ id: POLICY.calendarId }] }) });
  const calendar = data.calendars?.[POLICY.calendarId];
  if (!calendar || calendar.errors?.length || !Array.isArray(calendar.busy) || calendar.busy.some(block => !Number.isFinite(Date.parse(block.start)) || !Number.isFinite(Date.parse(block.end)))) throw new Error("Calendar availability could not be checked");
  return availableSlots(calendar.busy, now);
}
module.exports = { SCOPES, json, config, configured, store, owner, sameSite, encrypt, decrypt, issueBookingToken, bookingSession, tokenRequest, accessToken, api, availability };
