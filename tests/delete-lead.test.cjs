const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm");
test("lead deletion requires auth, validates IDs and retains booking records", async () => {
  let lead = { id: "lead_1", appointment: { calendarEventId: "event" } }, writes = 0;
  const sandbox = { exports: {}, require: () => ({ getLeadsStore: () => ({ get: async () => lead, setJSON: async (id, value) => { lead = value; writes++; } }) }) };
  vm.runInNewContext(fs.readFileSync("netlify/functions/delete-lead.js", "utf8"), sandbox);
  const run = (id, auth = true) => sandbox.exports.handler({ httpMethod: "POST", body: JSON.stringify({ id }) }, auth ? { clientContext: { user: { sub: "staff" } } } : {});
  assert.equal((await run("lead_1", false)).statusCode, 401);
  assert.equal((await run("../bad")).statusCode, 400);
  assert.equal(writes, 0);
  assert.equal((await run("lead_1")).statusCode, 200);
  assert.ok(lead.deletedAt);
  assert.equal(lead.appointment.calendarEventId, "event");
  assert.equal((await run("lead_1")).statusCode, 200);
  assert.equal(writes, 1);
});
