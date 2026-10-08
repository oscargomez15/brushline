const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"), vm = require("node:vm");
test("dashboard calendar requires owner access, expands recurring events and hides private details", async () => {
  const paths = [];
  const calendar = { owner: context => Boolean(context.owner), configured: () => true, store: () => ({ get: async () => ({ connected: true }) }), accessToken: async () => "token", json: (statusCode, body) => ({ statusCode, body }), api: async path => { paths.push(path); return { items: [{ id: "e", summary: "Free estimate — Client", start: { dateTime: "2026-10-08T10:00:00-04:00" } }, { id: "j", summary: "Job — Painting", start: { date: "2026-10-09" } }, { id: "p", summary: "Personal appointment", visibility: "private", location: "Private address", start: { date: "2026-10-10" } }, { id: "cancelled", status: "cancelled", start: { date: "2026-10-10" } }] }; } };
  const sandbox = { exports: {}, URLSearchParams, require: name => name === "./_google-calendar" ? calendar : require("../netlify/functions/" + name) };
  vm.runInNewContext(fs.readFileSync("netlify/functions/dashboard-appointments.js", "utf8"), sandbox);
  assert.equal((await sandbox.exports.handler({ httpMethod: "GET" }, {})).statusCode, 403);
  const result = await sandbox.exports.handler({ httpMethod: "GET" }, { owner: true });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.appointments.length, 3);
  assert.equal(result.body.appointments[0].type, "estimate");
  assert.equal(result.body.appointments[1].type, "job");
  assert.equal(result.body.appointments[2].title, "Busy");
  assert.equal(result.body.appointments[2].location, "");
  assert.ok(paths[0].includes("singleEvents=true"));
});
