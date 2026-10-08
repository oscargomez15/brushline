const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calendarWorkload } = require("../netlify/functions/_calendar-workload");
const now = Date.parse("2026-10-08T12:00:00Z");
const event = (start, end, extra = {}) => ({ start: { dateTime: `2026-10-08T${start}:00-04:00` }, end: { dateTime: `2026-10-08T${end}:00-04:00` }, ...extra });
test("workload colors respect working hours, merged overlaps and travel time", () => {
  assert.equal(calendarWorkload([], now)[0].status, "available");
  assert.equal(calendarWorkload([event("09:00", "13:00")], now)[0].status, "partial");
  assert.equal(calendarWorkload([event("09:00", "17:00")], now)[0].status, "full");
  assert.equal(calendarWorkload([event("18:00", "20:00")], now)[0].status, "available");
  assert.equal(calendarWorkload([event("09:00", "10:00"), event("09:00", "10:00")], now)[0].busyMinutes, 90);
});
test("closed days, transparent events and all-day jobs are classified correctly", () => {
  assert.equal(calendarWorkload([], now)[2].status, "closed");
  assert.equal(calendarWorkload([event("09:00", "17:00", { transparency: "transparent" })], now)[0].status, "available");
  assert.equal(calendarWorkload([{ start: { date: "2026-10-08" }, end: { date: "2026-10-10" } }], now)[1].status, "full");
});
