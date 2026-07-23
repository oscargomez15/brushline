const { getStore } = require("@netlify/blobs");
const { getQuoteNumber } = require("./_quote-number");

function safeStr(v) {
  return (v || "").toString().trim();
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireAuth(context) {
  const user = context?.clientContext?.user;
  return user || null;
}

function makeId() {
  return `inv_${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${rand}`;
}

exports.handler = async (event, context) => {
  const viewToken = Math.random().toString(36).slice(2) + Date.now().toString(36);

  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const quoteId = safeStr(body.quoteId);
    if (!quoteId) {
      return json(400, { error: "quoteId is required" });
    }

    const quotesStore = getStore("quotes", { siteID, token });
    const quotesIndexStore = getStore("quotes_index", { siteID, token });
    const invoicesStore = getStore("invoices", { siteID, token });
    const invoicesIndexStore = getStore("invoices_index", { siteID, token });

    const quote = await quotesStore.get(quoteId, { type: "json" });
    if (!quote) {
      return json(404, { error: "Quote not found" });
    }

    // Prevent duplicates only if linked invoice still exists
    const linkedInvoiceId = safeStr(quote.linkedInvoiceId);

    if (linkedInvoiceId) {
      const existingInvoice = await invoicesStore.get(linkedInvoiceId, { type: "json" });

      if (existingInvoice) {
        return json(200, {
          ok: true,
          id: linkedInvoiceId,
          existing: true,
          url: `/invoice/${linkedInvoiceId}`,
          editUrl: `/crm/invoices/edit/${linkedInvoiceId}`,
        });
      }

      // stale link found, clear it
      const staleClearedAt = new Date().toISOString();

      const clearedQuote = {
        ...quote,
        linkedInvoiceId: null,
        updatedAt: staleClearedAt,
      };

      await quotesStore.setJSON(quoteId, clearedQuote);

      const existingQuoteIndex = await quotesIndexStore.get(quoteId, { type: "json" });
      if (existingQuoteIndex) {
        await quotesIndexStore.setJSON(quoteId, {
          ...existingQuoteIndex,
          linkedInvoiceId: null,
          updatedAt: staleClearedAt,
        });
      }

      quote.linkedInvoiceId = null;
    }

    const now = new Date().toISOString();
    const invoiceId = makeId();
    const invoiceNumber = makeInvoiceNumber();

    const grandTotal = Number(quote.grandTotal || 0);
    const depositPaid = Number(quote.depositPaid || 0);
    const depositRequired =
      Number(quote.depositRequired) ||
      Number(quote.depositAmount) ||
      Math.round(grandTotal * 0.4 * 100) / 100;

    const balanceDue = Math.max(0, grandTotal - depositPaid);

    const customer = {
      firstName: safeStr(quote?.customer?.firstName),
      lastName: safeStr(quote?.customer?.lastName),
      fullName:
        safeStr(quote?.customer?.fullName) ||
        safeStr(quote?.clientName),
      address: safeStr(quote?.customer?.address),
      unit: safeStr(quote?.customer?.unit),
      email: safeStr(quote?.customer?.email || quote?.email),
      phone: safeStr(quote?.customer?.phone || quote?.phone),
    };

    const invoice = {
      id: invoiceId,
      invoiceNumber,
      createdAt: now,
      updatedAt: now,
      viewToken,
      viewedAt: null,
      viewedBy: null,
      createdBy: {
        id: user.sub,
        email: user.email,
      },

      source: "quote",
      sourceQuoteId: quote.id,
      linkedQuoteId: quote.id,
      quoteNumber: getQuoteNumber(quote),

      customerId: safeStr(quote.customerId) || null,
      customer,

      clientName: safeStr(quote.clientName) || customer.fullName,
      projectAddress:
        safeStr(quote.projectAddress) ||
        (customer.unit ? `${customer.address}, ${customer.unit}` : customer.address),

      email: safeStr(quote.email) || customer.email,
      phone: safeStr(quote.phone) || customer.phone,

      companyName: safeStr(quote.companyName) || "Brushline Services",
      jobType: safeStr(quote.jobType),
      status: "draft",

      lineItems: Array.isArray(quote.lineItems) ? quote.lineItems : [],
      scopeOfWork: quote.scopeOfWork || null,
      estimatorData: quote.estimatorData || null,
      notes: quote.notes || "",
      terms: quote.terms || "",
      termsVersion: quote.termsVersion || null,

      subtotal: Number(quote.subtotal || 0),
      tax: Number(quote.tax || 0),
      grandTotal,
      depositRequired,
      depositPaid,
      balanceDue,

      dueDate: null,
      sentAt: null,
      paidAt: null,

      paymentStatus:
        depositPaid >= grandTotal
          ? "paid"
          : depositPaid > 0
            ? "partial"
            : "unpaid",
    };

    await invoicesStore.setJSON(invoiceId, invoice);

    await invoicesIndexStore.setJSON(invoiceId, {
      id: invoiceId,
      invoiceNumber,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      linkedQuoteId: quote.id,
      sourceQuoteId: quote.id,
      customerId: invoice.customerId,
      clientName: invoice.clientName,
      projectAddress: invoice.projectAddress,
      jobType: invoice.jobType,
      grandTotal: invoice.grandTotal,
      balanceDue: invoice.balanceDue,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
    });

    const updatedQuote = {
      ...quote,
      linkedInvoiceId: invoiceId,
      invoiceCreatedAt: now,
      updatedAt: now,
    };

    await quotesStore.setJSON(quoteId, updatedQuote);

    const existingQuoteIndex = await quotesIndexStore.get(quoteId, { type: "json" });
    if (existingQuoteIndex) {
      await quotesIndexStore.setJSON(quoteId, {
        ...existingQuoteIndex,
        linkedInvoiceId: invoiceId,
        invoiceCreatedAt: now,
        updatedAt: now,
      });
    }

    return json(200, {
      ok: true,
      id: invoiceId,
      invoiceNumber,
      existing: false,
      url: `/invoice/${invoiceId}`,
      editUrl: `/crm/invoices/edit/${invoiceId}`,
    });
  } catch (err) {
    console.error("create-invoice-from-quote crashed:", err);
    return json(500, {
      error: "create-invoice-from-quote failed",
      message: err?.message || String(err),
    });
  }
};
