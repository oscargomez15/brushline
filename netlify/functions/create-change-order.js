const { getStore } = require("@netlify/blobs");
const { randomUUID, randomBytes } = require("crypto");
const { getQuoteNumber } = require("./_quote-number");
const { buildQuotePdfBase64 } = require("./_pdf");
const { handler: sendEmail } = require("./resend-quote-email");

const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const user = context?.clientContext?.user;
  if (!user) return json(401, { error: "Unauthorized" });
  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid JSON" }); }
  const description = String(body.description || "").trim();
  const title = String(body.title || "").trim();
  const price = Number(body.price);
  if (!body.quoteId || !title || !description || title.length > 200 || description.length > 10000 || !Number.isFinite(price) || price <= 0) {
    return json(400, { error: "Enter a title, added scope of work, and a positive price" });
  }
  try {
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });
    const quotes = getStore("quotes", { siteID, token });
    const index = getStore("quotes_index", { siteID, token });
    const parent = await quotes.get(String(body.quoteId), { type: "json", consistency: "strong" });
    if (!parent) return json(404, { error: "Quote not found" });
    if (parent.status !== "approved" || parent.documentType === "change_order") {
      return json(409, { error: "Create change orders from the original approved quote" });
    }
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const parentQuoteNumber = getQuoteNumber(parent);
    const grandTotal = Math.round(price * 100) / 100;
    if (grandTotal <= 0) return json(400, { error: "Price must be at least $0.01" });
    const quote = {
      id, quoteNumber: `${parentQuoteNumber}-CO-${id.slice(0, 8).toUpperCase()}`,
      documentType: "change_order", parentQuoteId: parent.id, parentQuoteNumber,
      originalApprovedTotal: Number(parent.grandTotal),
      createdAt, createdBy: { id: user.sub, email: user.email },
      customerId: parent.customerId || null, customer: parent.customer,
      clientName: parent.clientName, projectAddress: parent.projectAddress,
      email: parent.email || parent.customer?.email, phone: parent.phone,
      companyName: parent.companyName, jobType: "handyman",
      lineItems: [{ title, description, price: grandTotal }],
      subtotal: grandTotal, grandTotal, status: "awaiting_approval", approvedAt: null,
      viewToken: randomBytes(32).toString("hex"),
      terms: parent.terms, termsVersion: parent.termsVersion,
      note: `Change order for approved quote #${parentQuoteNumber}. This authorizes only the additional work listed here, priced separately from the original approved total of $${Number(parent.grandTotal).toFixed(2)}. The original agreement remains in effect. This change order will be invoiced separately after approval.`,
    };
    // Prepare the PDF before saving so a rendering failure cannot create an invisible duplicate.
    const pdf = await buildQuotePdfBase64(quote);
    await quotes.setJSON(id, quote);
    await index.setJSON(id, {
      id, quoteNumber: quote.quoteNumber, documentType: quote.documentType,
      parentQuoteId: parent.id, parentQuoteNumber, customerId: quote.customerId,
      createdAt, clientName: quote.clientName, projectAddress: quote.projectAddress,
      jobType: quote.jobType, grandTotal, status: quote.status,
    });
    await getStore("quotes_pdfs", { siteID, token }).set(id, pdf);
    const email = await sendEmail({ httpMethod: "POST", body: JSON.stringify({ quoteId: id }) }, context);
    return json(200, { id, quote, emailSent: email.statusCode === 200 });
  } catch (error) {
    console.error("create-change-order failed", error);
    return json(500, { error: "Could not create change order" });
  }
};
