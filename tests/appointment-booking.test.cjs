const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const policy = require("../netlify/functions/_appointment-policy");

test("Eastern slots respect weekdays, visit length, office hours, and 24-hour notice", () => {
  const now = Date.parse("2026-10-06T15:00:00Z");
  const slots = policy.candidates(now);
  assert.ok(slots.length > 0);
  for (const slot of slots) {
    assert.ok(Date.parse(slot.start) >= now + 86400000);
    assert.equal(Date.parse(slot.end) - Date.parse(slot.start), 45 * 60000);
    assert.ok(![0, 6].includes(new Date(slot.date + "T12:00:00Z").getUTCDay()));
    assert.ok(slot.start >= policy.easternInstant(slot.date, 9 * 60));
    assert.ok(slot.end <= policy.easternInstant(slot.date, 17 * 60));
  }
});
test("Eastern booking times follow daylight saving changes", () => {
  assert.equal(policy.easternInstant("2026-10-30", 540), "2026-10-30T13:00:00.000Z");
  assert.equal(policy.easternInstant("2026-11-02", 540), "2026-11-02T14:00:00.000Z");
});
test("busy appointments enforce a thirty-minute gap on either side", () => {
  const slots = policy.availableSlots([{ start: "2026-10-07T14:00:00Z", end: "2026-10-07T14:45:00Z" }], Date.parse("2026-10-06T12:00:00Z"));
  assert.ok(!slots.some(slot => slot.start === "2026-10-07T13:00:00.000Z"));
  assert.ok(!slots.some(slot => slot.start === "2026-10-07T15:00:00.000Z"));
  assert.ok(slots.some(slot => slot.start === "2026-10-07T15:15:00.000Z"));
});
test("unsupported and excluded service areas cannot book", () => {
  assert.equal(policy.eligibleAddress("123 Main St, Naples FL 34102"), true);
  assert.equal(policy.eligibleAddress("123 Main St, Miami FL"), false);
  assert.equal(policy.eligibleAddress("123 Main St, Lehigh Acres, near Fort Myers"), false);
  assert.equal(policy.eligibleAddress("123 Main St, Tampa FL"), false);
});

function fixture({ conflict = false, leadFails = false, insertThrows = false } = {}) {
  const entries = new Map(); let revision = 0, inserts = 0, leads = 0, created;
  const store = {
    get: async key => entries.get(key)?.data || null,
    getWithMetadata: async key => entries.get(key) || null,
    setJSON: async (key, data, options = {}) => {
      const previous = entries.get(key);
      if ((options.onlyIfNew && previous) || (options.onlyIfMatch && previous?.etag !== options.onlyIfMatch)) return { modified: false };
      const etag = String(++revision); entries.set(key, { data, etag }); return { modified: true, etag };
    },
  };
  const slot = policy.candidates()[0];
  const calendar = {
    json: (statusCode, body) => ({ statusCode, body: JSON.stringify(body) }), sameSite: event => event.headers.origin === "https://brushlineservices.com",
    bookingSession: token => { if (token !== "valid") throw Error("invalid"); return { id: "session" }; },
    store: () => store, accessToken: async () => "access", availability: async () => conflict ? [] : [slot],
    api: async (path, access, options) => {
      if (options?.method === "POST") { inserts++; created = JSON.parse(options.body); if (insertThrows && inserts === 1) throw Error("Response lost after creation"); return created; }
      if (created) return created;
      const error = Error("not found"); error.status = 404; throw error;
    },
  };
  const lead = { fullName: "Test Client", phone: "2395550100", email: "test@example.com", address: "123 Main St, Cape Coral FL 33904", service: "Painting" };
  const sandbox = { exports: {}, console, Buffer, Date, require: name => name === "node:crypto" ? crypto : name === "./_google-calendar" ? calendar : name === "./_appointment-policy" ? policy : name === "./save-website-lead" ? { handler: async () => { leads++; if (leadFails && leads === 1) throw Error("Storage unavailable"); return calendar.json(200, { id: "lead_booking_session", emailSent: true }); } } : (() => { throw Error(name); })() };
  vm.runInNewContext(fs.readFileSync("netlify/functions/book-estimate-appointment.js", "utf8"), sandbox);
  const run = patch => sandbox.exports.handler({ httpMethod: "POST", headers: { origin: "https://brushlineservices.com" }, body: JSON.stringify({ bookingToken: "valid", start: slot.start, confirmed: true, lead, ...patch }) });
  return { run, entries, slot, counts: () => ({ inserts, leads }), created: () => created, handler: sandbox.exports.handler };
}
test("confirmed booking creates one Google event and one lead across retries", async () => {
  const f = fixture();
  const first = await f.run(); assert.equal(first.statusCode, 200); assert.equal(JSON.parse(first.body).appointmentBooked, true);
  assert.equal((await f.run()).statusCode, 200);
  assert.deepEqual(f.counts(), { inserts: 1, leads: 1 });
  assert.equal(f.created().attendees[0].email, "test@example.com");
  assert.equal(f.created().visibility, "private");
});
test("conflicting time cannot create an event", async () => {
  const f = fixture({ conflict: true }); assert.equal((await f.run()).statusCode, 409); assert.equal(f.counts().inserts, 0);
});
test("day lock prevents concurrent website booking attempts", async () => {
  const f = fixture();
  f.entries.set("day-lock/" + f.slot.date, { data: { expires: Date.now() + 60000 }, etag: "busy" });
  assert.equal((await f.run()).statusCode, 409); assert.equal(f.counts().inserts, 0);
});
test("session lock prevents a client booking two different dates concurrently", async () => {
  const f = fixture(); f.entries.set("session-lock/session", { data: { expires: Date.now() + 60000 }, etag: "busy" });
  assert.equal((await f.run()).statusCode, 409); assert.equal(f.counts().inserts, 0);
});
test("lost Google response is recovered with the same event ID", async () => {
  const f = fixture({ insertThrows: true }); assert.equal((await f.run()).statusCode, 503); assert.equal((await f.run()).statusCode, 200); assert.equal(f.counts().inserts, 1);
});
test("CRM failure retains booking confirmation and can recover on retry", async () => {
  const f = fixture({ leadFails: true }); const first = JSON.parse((await f.run()).body);
  assert.equal(first.appointmentBooked, true); assert.equal(first.leadSaved, false);
  assert.equal(JSON.parse((await f.run()).body).leadSaved, true); assert.equal(f.counts().inserts, 1);
});
test("confirmation, signed session and service address are required", async () => {
  const f = fixture();
  assert.equal((await f.run({ confirmed: false })).statusCode, 400);
  assert.equal((await f.run({ bookingToken: "forged" })).statusCode, 400);
  assert.equal((await f.run({ lead: { fullName: "Missing fields" } })).statusCode, 400);
  assert.equal((await f.handler({ httpMethod: "POST", headers: { origin: "https://other.example" } })).statusCode, 403);
  assert.equal(f.counts().inserts, 0);
});

function securityFixture() {
  const sandbox = { module: { exports: {} }, exports: {}, Buffer, URL, URLSearchParams, Date, AbortSignal, process: { env: { GOOGLE_CALENDAR_ENCRYPTION_KEY: "11".repeat(32), GOOGLE_CALENDAR_CLIENT_ID: "test-client", GOOGLE_CALENDAR_CLIENT_SECRET: "test-secret" } }, require: name => name === "@netlify/blobs" ? { getStore: () => ({}) } : require(name === "./_appointment-policy" ? "../netlify/functions/_appointment-policy" : name) };
  vm.runInNewContext(fs.readFileSync("netlify/functions/_google-calendar.js", "utf8"), sandbox);
  return sandbox.module.exports;
}
test("booking sessions reject forged signatures and expired tokens", () => {
  const calendar = securityFixture(); const token = calendar.issueBookingToken();
  assert.ok(calendar.bookingSession(token).id);
  assert.throws(() => calendar.bookingSession(token + "x"));
  const payload = Buffer.from(JSON.stringify({ id: "expired", expires: Date.now() - 1 })).toString("base64url");
  const signed = payload + "." + crypto.createHmac("sha256", Buffer.from("11".repeat(32), "hex")).update(payload).digest("base64url");
  assert.throws(() => calendar.bookingSession(signed), /expired/);
});
test("refresh tokens are encrypted and tampering fails authentication", () => {
  const calendar = securityFixture(); const encrypted = calendar.encrypt({ refreshToken: "private-token" });
  assert.ok(!JSON.stringify(encrypted).includes("private-token"));
  assert.equal(calendar.decrypt(encrypted).refreshToken, "private-token");
  assert.throws(() => calendar.decrypt({ ...encrypted, tag: Buffer.alloc(16).toString("base64") }));
});
test("calendar management requires the owner and same-site connection writes", () => {
  const calendar = securityFixture();
  assert.equal(calendar.owner({ clientContext: { user: { email: "murdexchannel@gmail.com" } } }), true);
  assert.equal(calendar.owner({ clientContext: { user: { email: "someone@example.com" } } }), false);
  assert.equal(calendar.sameSite({ headers: { origin: "https://brushlineservices.com" } }), true);
  assert.equal(calendar.sameSite({ headers: { origin: "https://evil.example" } }), false);
});
