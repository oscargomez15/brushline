export function getQuoteNumber(quote = {}) {
  if (String(quote.quoteNumber || "").trim()) return String(quote.quoteNumber).trim();

  let date = quote.createdAt ? new Date(quote.createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) {
    const timestamp = Number(String(quote.id || quote.linkedQuoteId || "").split("-")[0]);
    date = timestamp ? new Date(timestamp) : new Date();
  }

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  const id = String(quote.id || quote.linkedQuoteId || "");
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = ((hash * 31) + id.charCodeAt(i)) >>> 0;
  const code = String(1000 + (hash % 9000));

  return `EST-${mm}${dd}${yy}-${code}`;
}
