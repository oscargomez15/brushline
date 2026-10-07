const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm"), crypto = require("node:crypto");
const helperSandbox = { module: { exports: {} }, console, process: { env: {} }, require: name => name === "node:crypto" ? crypto : { getStore: () => ({}) } };
vm.runInNewContext(fs.readFileSync("netlify/functions/_crm-notifications.js", "utf8"), helperSandbox);
const { notificationsFrom, notificationId } = helperSandbox.module.exports;

test("manual and automated follow-up notifications use delivery IDs to deduplicate", async () => {
  const records = new Map();
  const sandbox = { module: { exports: {} }, console, process: { env: {} }, require: name => name === "node:crypto" ? crypto : { getStore: () => ({ setJSON: async (key, item) => { if (!records.has(key)) records.set(key, item); } }) } };
  vm.runInNewContext(fs.readFileSync("netlify/functions/_crm-notifications.js", "utf8"), sandbox);
  const quote = { id: "q1", clientName: "Client", quoteNumber: "Q-1" };
  await sandbox.module.exports.recordQuoteFollowUp(quote, { deliveryId: "manual-1", mode: "manual", recipient: "client@example.com" });
  await sandbox.module.exports.recordQuoteFollowUp(quote, { deliveryId: "auto-1", mode: "automated", recipient: "client@example.com" });
  await sandbox.module.exports.recordQuoteFollowUp(quote, { deliveryId: "auto-1", mode: "automated", recipient: "client@example.com" });
  assert.equal(records.size, 2);
  assert.ok([...records.values()].some(item => item.detail.includes("Manual")));
  assert.ok([...records.values()].some(item => item.detail.includes("Automated")));
});

test("quote views keep a stable notification separate from approval", () => {
  const quote = { id: "q1", clientName: "Client", quoteNumber: "Q-1", firstViewedAt: "2026-10-07T12:00:00Z", approvedAt: "2026-10-07T13:00:00Z" };
  const first = notificationsFrom([], [quote], []);
  const repeat = notificationsFrom([], [{ ...quote, lastViewedAt: "2026-10-07T14:00:00Z", viewCount: 2 }], []);
  assert.equal(first.length, 2);
  assert.equal(first.find(item => item.type === "view").id, repeat.find(item => item.type === "view").id);
  assert.equal(repeat.find(item => item.type === "view").createdAt, quote.firstViewedAt);
  assert.equal(notificationsFrom([], [{ id: "unviewed" }], []).length, 0);
});

test("tracking validates access and preserves the first view across visits", async () => {
  let quote = { id: "q", viewToken: "secret", clientName: "Client", quoteNumber: "Q-2" }, index = {};
  const sandbox = { exports: {}, console, process: { env: { NETLIFY_SITE_ID: "site", NETLIFY_AUTH_TOKEN: "token" } }, require: name => name === "crypto" ? crypto : { getStore: name => ({ get: async () => name === "quotes" ? quote : index, setJSON: async (id, value) => { if (name === "quotes") quote = value; else index = value; } }) } };
  vm.runInNewContext(fs.readFileSync("netlify/functions/track-quote-view.js", "utf8"), sandbox);
  const run = token => sandbox.exports.handler({ httpMethod: "POST", body: JSON.stringify({ id: "q", t: token }), headers: { "user-agent": "test" } });
  assert.equal((await run("invalid")).statusCode, 403);
  assert.equal(index.firstViewedAt, undefined);
  assert.equal((await run("secret")).statusCode, 200);
  const first = index.firstViewedAt;
  assert.ok(first);
  assert.equal((await run("secret")).statusCode, 200);
  assert.equal(index.firstViewedAt, first);
  assert.equal(index.viewCount, 1);
  assert.equal(index.clientName, "Client");
});
test("leads, bookings and approvals have stable distinct identities and route links", () => {
  const items = notificationsFrom([{ id: "lead1", fullName: "Test Client", service: "Painting", createdAt: "2026-10-07T12:00:00Z", appointment: { status: "booked", calendarEventId: "event1" }, preferredAppointment: "Friday at 9 AM" }], [{ id: "quote1", quoteNumber: "Q-1", clientName: "Test Client", approvedAt: "2026-10-07T13:00:00Z" }], []);
  assert.equal(items.length, 3); assert.equal(new Set(items.map(item => item.id)).size, 3);
  assert.equal(items[0].type, "approval"); assert.ok(items.every(item => item.href.startsWith("/crm/")));
  assert.equal(notificationsFrom([], [], [{ id: "bad", createdAt: "invalid", href: "https://evil.example" }]).length, 0);
});
test("booking events are deduplicated with the canonical CRM lead", () => {
  const items = notificationsFrom([{ id: "l", createdAt: "2026-10-07T12:00:00Z", appointment: { status: "booked", calendarEventId: "e" } }], [], [{ id: notificationId("booking:e"), type: "booking", title: "New estimate booked", createdAt: "2026-10-07T12:00:00Z", href: "/crm/leads" }]);
  assert.equal(items.filter(item => item.type === "booking").length, 1);
});
test("notification endpoint requires authentication and stores reads separately for each user", async () => {
  const writes = [], readKeys = [];
  const sandbox = { exports: {}, Date, console, require: () => ({ notificationId, notificationsFrom, listRecords: async () => [], store: () => ({ setJSON: async key => writes.push(key), get: async key => { readKeys.push(key); return null; } }) }) };
  vm.runInNewContext(fs.readFileSync("netlify/functions/crm-notifications.js", "utf8"), sandbox);
  const run = (sub, ids) => sandbox.exports.handler({ httpMethod: "POST", body: JSON.stringify({ ids }) }, sub ? { clientContext: { user: { sub } } } : {});
  assert.equal((await run(null, [])).statusCode, 401);
  assert.equal((await run("user1", ["bad-id"])).statusCode, 400);
  const id = notificationId("lead:l"); assert.equal((await run("user1", [id])).statusCode, 200); assert.equal((await run("user2", [id])).statusCode, 200);
  assert.notEqual(writes[0], writes[1]); assert.ok(writes.every(key => key.endsWith("/" + id)));
});
