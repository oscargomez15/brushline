function quoteDate(quote = {}) {
  const created = quote.createdAt ? new Date(quote.createdAt) : null;
  if (created && !Number.isNaN(created.getTime())) return created;

  const timestamp = Number(String(quote.id || "").split("-")[0]);
  const fromId = timestamp ? new Date(timestamp) : null;
  return fromId && !Number.isNaN(fromId.getTime()) ? fromId : new Date();
}

function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

function makeQuoteNumber(date = new Date()) {
  const code = Math.floor(1000 + Math.random() * 9000);
  return `EST-${formatDate(date)}-${code}`;
}

function getQuoteNumber(quote = {}) {
  if (String(quote.quoteNumber || "").trim()) return String(quote.quoteNumber).trim();
  const id = String(quote.id || "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = ((hash * 31) + id.charCodeAt(i)) >>> 0;
  const code = String(1000 + (hash % 9000));
  return `EST-${formatDate(quoteDate(quote))}-${code}`;
}

module.exports = { getQuoteNumber, makeQuoteNumber };
