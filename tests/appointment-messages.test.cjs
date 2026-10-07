const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm");
function fixture(failOwner = false) {
  const sent = [], stored = [], sandbox = { module: { exports: {} }, console, Date, setTimeout, clearTimeout, process: { env: { RESEND_API_KEY: "test", CONTACT_NOTIFY_FROM: "Oscar <murdexchannel@gmail.com>", APPOINTMENT_NOTIFY_FROM: "Oscar <murdexchannel@gmail.com>" } }, require: () => ({ Resend: class { constructor() { this.emails = { send: async (payload, options) => { sent.push({ payload, options }); if (failOwner && payload.to === "oscargomez@brushlineservices.com") { failOwner = false; return { error: { name: "TemporaryFailure" } }; } return { data: { id: "email_" + sent.length } }; } }; } } }) };
  vm.runInNewContext(fs.readFileSync("netlify/functions/_appointment-messages.js", "utf8"), sandbox);
  const record = { eventId: "event123", lead: { fullName: "<Test Client>", email: "client@example.com", phone: "2395550100", address: "123 Test Street, Cape Coral", service: "Painting", projectDetails: "Interior walls" }, result: { preferredAppointment: "Friday, October 9 at 9:00 AM Eastern" } };
  const store = { setJSON: async (key, value) => { stored.push(JSON.parse(JSON.stringify(value))); } };
  return { record, sent, run: () => sandbox.module.exports.sendAppointmentMessages(store, "booking/test", record) };
}
test("client and explicit owner receive appointment details with separate idempotency keys", async () => {
  const f = fixture(); await f.run();
  assert.equal(f.sent[0].payload.to, "client@example.com"); assert.equal(f.sent[1].payload.to, "oscargomez@brushlineservices.com");
  for (const message of f.sent) { assert.ok(message.payload.text.includes("45 minutes")); assert.ok(message.payload.text.includes("123 Test Street")); assert.ok(message.payload.text.includes("Eastern")); assert.ok(message.payload.html.includes("&lt;Test Client&gt;")); }
  for (const message of f.sent) assert.equal(message.payload.from, "Brushline Services <appointments@brushlineservices.com>");
  assert.equal(f.sent[0].payload.replyTo, "oscargomez@brushlineservices.com");
  assert.notEqual(f.sent[0].options.idempotencyKey, f.sent[1].options.idempotencyKey);
  await f.run(); assert.equal(f.sent.length, 2); assert.equal(f.record.result.clientEmailSent, true); assert.equal(f.record.result.ownerEmailSent, true);
});
test("a failed owner email retries without resending the client email", async () => {
  const f = fixture(true); await f.run(); assert.equal(f.record.result.clientEmailSent, true); assert.equal(f.record.result.ownerEmailSent, false);
  await f.run(); assert.equal(f.sent.length, 3); assert.equal(f.sent[1].options.idempotencyKey, f.sent[2].options.idempotencyKey); assert.equal(f.record.result.ownerEmailSent, true);
});
