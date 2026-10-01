const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function fixture(filename, parent = {}) {
  const stores = new Map();
  const sent = [];
  const base = { id: "original", quoteNumber: "Q-100", status: "approved", grandTotal: 1000, email: "customer@example.com", customer: { email: "customer@example.com" }, viewToken: "secret", ...parent };
  function getStore(name) {
    if (!stores.has(name)) stores.set(name, new Map());
    const rows = stores.get(name);
    return { get: async (id) => rows.get(id), setJSON: async (id, value) => rows.set(id, value), set: async (id, value) => rows.set(id, value) };
  }
  getStore("quotes").setJSON(base.id, base);
  getStore("invoices").setJSON(base.id, base);
  const mocks = {
    "@netlify/blobs": { getStore },
    "./_pdf": { buildQuotePdfBase64: async () => "cGRm" },
    "./_invoice-pdf": { buildInvoicePdfBase64: async () => "cGRm" },
    "./_quote-number": { getQuoteNumber: (quote) => quote.quoteNumber },
    "./_terms": {},
    "./resend-quote-email": { handler: async () => ({ statusCode: 200 }) },
    resend: { Resend: class { constructor() { this.emails = { send: async (payload) => { sent.push(payload); return parent.emailFailure ? { error: { message: "Rejected" } } : { data: { id: "sent" } }; } }; } } },
  };
  const sandbox = { exports: {}, Buffer, console: { log() {}, warn() {}, error() {} }, process: { env: { NETLIFY_SITE_ID: "site", NETLIFY_AUTH_TOKEN: "token", RESEND_API_KEY: "key", QUOTE_NOTIFY_FROM: "sender@example.com", PUBLIC_QUOTE_BASE_URL: "https://example.com/quote", PUBLIC_INVOICE_BASE_URL: "https://example.com/invoice" } }, require: (id) => mocks[id] || require(id) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../netlify/functions", filename), "utf8"), sandbox);
  return { handler: sandbox.exports.handler, stores, sent, base };
}
const auth = { clientContext: { user: { sub: "admin", email: "admin@example.com" } } };
const post = (body) => ({ httpMethod: "POST", body: JSON.stringify(body) });

test("forwarding uses the alternate recipient and preserves customer email", async () => {
  const f = fixture("resend-quote-email.js");
  const result = await f.handler(post({ quoteId: "original", forwardTo: "other@example.com" }), auth);
  assert.equal(result.statusCode, 200);
  assert.equal(f.sent[0].to, "other@example.com");
  assert.equal(f.sent[0].attachments.length, 1);
  assert.match(f.sent[0].text, /t=secret/);
  assert.equal(f.base.email, "customer@example.com");
});
test("forwarding rejects invalid recipients, requires auth, and reports provider failure", async () => {
  const f = fixture("resend-quote-email.js", { emailFailure: true });
  assert.equal((await f.handler(post({ quoteId: "original" }), {})).statusCode, 401);
  assert.equal((await f.handler(post({ quoteId: "original", forwardTo: "" }), auth)).statusCode, 400);
  assert.equal((await f.handler(post({ quoteId: "original", forwardTo: "invalid" }), auth)).statusCode, 400);
  assert.equal((await f.handler(post({ quoteId: "original" }), auth)).statusCode, 500);
});
test("change order links to original, starts unsigned, and leaves original intact", async () => {
  const f = fixture("create-change-order.js");
  const before = JSON.stringify(f.base);
  const result = await f.handler(post({ quoteId: "original", title: "Extra room", description: "Paint added bedroom", price: "250.25" }), auth);
  assert.equal(result.statusCode, 200);
  const { quote, emailSent } = JSON.parse(result.body);
  assert.equal(quote.parentQuoteId, "original");
  assert.equal(quote.originalApprovedTotal, 1000);
  assert.equal(quote.grandTotal, 250.25);
  assert.equal(quote.status, "awaiting_approval");
  assert.equal(quote.signature, undefined);
  assert.notEqual(quote.viewToken, "secret");
  assert.equal(emailSent, true);
  assert.equal(JSON.stringify(f.stores.get("quotes").get("original")), before);
});
test("change orders require approval of original, auth, and valid positive pricing", async () => {
  const body = { quoteId: "original", title: "Extra", description: "Work", price: 100 };
  assert.equal((await fixture("create-change-order.js").handler(post(body), {})).statusCode, 401);
  assert.equal((await fixture("create-change-order.js", { status: "awaiting_approval" }).handler(post(body), auth)).statusCode, 409);
  for (const price of [0, -1, "bad", 0.001]) assert.equal((await fixture("create-change-order.js").handler(post({ ...body, price }), auth)).statusCode, 400);
});
test("unapproved change orders cannot be invoiced; approved quotes cannot be edited", async () => {
  const f = fixture("create-invoice-from-quote.js", { documentType: "change_order", status: "awaiting_approval" });
  assert.equal((await f.handler(post({ quoteId: "original" }), auth)).statusCode, 409);
  assert.equal((await fixture("update-quote.js").handler(post({ id: "original", grandTotal: 900 }), auth)).statusCode, 409);
});

test("signed change order can be approved and invoiced separately", async () => {
  const f = fixture("approve-quote.js", { documentType: "change_order", status: "awaiting_approval", jobType: "handyman", grandTotal: 250, parentQuoteId: "base" });
  const result = await f.handler({ ...post({ id: "original", typedName: "Customer", signatureDataUrl: "data:image/png;base64," + Buffer.alloc(150).toString("base64") }), headers: {} });
  assert.equal(result.statusCode, 200);
  const approved = f.stores.get("quotes").get("original");
  assert.equal(approved.status, "approved");
  assert.equal(approved.signature.typedName, "Customer");
  assert.equal(approved.grandTotal, 250);
  const invoiceFixture = fixture("create-invoice-from-quote.js", approved);
  const invoiceResult = await invoiceFixture.handler(post({ quoteId: "original" }), auth);
  assert.equal(invoiceResult.statusCode, 200);
  const invoice = invoiceFixture.stores.get("invoices").get(JSON.parse(invoiceResult.body).id);
  assert.equal(invoice.grandTotal, 250);
  assert.equal(invoice.parentQuoteId, "base");
  assert.equal(invoice.source, "change_order");
});

test("invoice provider rejection cannot return a success confirmation", async () => {
  const f = fixture("send-invoice-email.js", { emailFailure: true });
  const result = await f.handler(post({ invoiceId: "original" }), auth);
  assert.equal(result.statusCode, 500);
  assert.equal(f.stores.get("invoices").get("original").sentAt, undefined);
});
test("successful invoice email returns its recipient", async () => {
  const f = fixture("send-invoice-email.js");
  const result = await f.handler(post({ invoiceId: "original" }), auth);
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).sentTo, "customer@example.com");
});
