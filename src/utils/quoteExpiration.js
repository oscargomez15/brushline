const ZONE = "America/New_York";
function easternDay(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = key => parts.find(p => p.type === key).value;
  return part("year") + "-" + part("month") + "-" + part("day");
}
function quoteExpiration(quote, now = Date.now()) {
  if (!quote?.createdAt) return { date: null, label: "Date unavailable", expired: false, canApprove: false };
  const issued = easternDay(quote.createdAt);
  const days = quote.validForDays == null ? 30 : Number(quote.validForDays);
  if (!issued || !Number.isInteger(days) || days < 0 || days > 36500) return { date: null, label: "Date unavailable", expired: false, canApprove: false };
  const end = new Date(issued + "T12:00:00Z");
  end.setUTCDate(end.getUTCDate() + days);
  const date = end.toISOString().slice(0, 10);
  const approved = quote.status === "approved" || Boolean(quote.approvedAt);
  const expired = !approved && (quote.status === "expired" || easternDay(now) > date);
  const closed = ["declined", "rejected", "cancelled", "canceled"].includes(quote.status);
  return { date, label: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(end), expired, canApprove: !approved && !expired && !closed };
}
module.exports = { quoteExpiration };
