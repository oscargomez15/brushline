// Follow-ups remain disabled until a reviewed sending workflow is implemented.
const FOLLOW_UP_SENDING_ENABLED = false;
function followUpBlockReason(quote, settings) {
  if (!quote) return "Quote missing";
  if (settings?.state === "declined" || ["declined", "rejected"].includes(quote.status)) return "Quote declined / rejected";
  if (quote.documentType === "change_order") return "Change order";
  if (quote.status !== "awaiting_approval" || quote.approvedAt) return "Quote is not awaiting approval";
  if (!settings || settings.state !== "review") return "Follow-ups suppressed";
  if (!FOLLOW_UP_SENDING_ENABLED) return "Follow-up sending is inactive";
  return null;
}
module.exports = { followUpBlockReason };
