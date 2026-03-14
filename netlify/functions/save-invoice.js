const { getStore } = require("@netlify/blobs");

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

function makeViewToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const invoicesStore = getStore("invoices", { siteID, token });
    const invoicesIndexStore = getStore("invoices_index", { siteID, token });
    const quotesStore = getStore("quotes", { siteID, token });
    const quotesIndexStore = getStore("quotes_index", { siteID, token });

    const now = new Date().toISOString();
    const id = safeStr(payload.id) || makeId();
    const existing = await invoicesStore.get(id, { type: "json" });

    const lineItems = Array.isArray(payload.lineItems)
      ? payload.lineItems.map((item, i) => {
          const qty = Number(item?.qty ?? item?.quantity ?? 1) || 0;
          const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0) || 0;
          const total = Number(item?.total ?? qty * unitPrice) || 0;

          return {
            id: safeStr(item?.id) || `line-${i + 1}`,
            description: safeStr(item?.description || item?.name || `Line item ${i + 1}`),
            qty,
            unitPrice,
            total,
          };
        })
      : [];

    const subtotal =
      Number(payload.subtotal) ||
      lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    const tax = Number(payload.tax) || 0;
    const grandTotal = Number(payload.grandTotal) || subtotal + tax;
    const depositPaid = Number(payload.depositPaid) || 0;
    const balanceDue =
      payload.balanceDue !== undefined && payload.balanceDue !== null && payload.balanceDue !== ""
        ? Number(payload.balanceDue) || 0
        : Math.max(0, grandTotal - depositPaid);

    const status = safeStr(payload.status) || existing?.status || "draft";
    const paymentStatus =
      safeStr(payload.paymentStatus) ||
      (depositPaid >= grandTotal
        ? "paid"
        : depositPaid > 0
          ? "partial"
          : "unpaid");

    const customer = {
      firstName: safeStr(payload?.customer?.firstName),
      lastName: safeStr(payload?.customer?.lastName),
      fullName:
        safeStr(payload?.customer?.fullName) ||
        safeStr(payload.clientName),
      address: safeStr(payload?.customer?.address),
      unit: safeStr(payload?.customer?.unit),
      email: safeStr(payload?.customer?.email || payload.email),
      phone: safeStr(payload?.customer?.phone || payload.phone),
    };

    const invoice = {
      id,
      invoiceNumber:
        safeStr(payload.invoiceNumber) ||
        existing?.invoiceNumber ||
        makeInvoiceNumber(),

      createdAt: existing?.createdAt || payload.createdAt || now,
      updatedAt: now,

      createdBy: existing?.createdBy || {
        id: user.sub,
        email: user.email,
      },
      viewToken: existing?.viewToken || payload.viewToken || makeViewToken(),
      viewedAt: existing?.viewedAt || null,
      viewedBy: existing?.viewedBy || null,

      companyName:
        safeStr(payload.companyName) ||
        existing?.companyName ||
        "Brushline Services",

      source: safeStr(payload.source) || existing?.source || "manual",
      sourceQuoteId:
        safeStr(payload.sourceQuoteId) ||
        safeStr(payload.linkedQuoteId) ||
        existing?.sourceQuoteId ||
        null,

      linkedQuoteId:
        safeStr(payload.linkedQuoteId) ||
        existing?.linkedQuoteId ||
        null,

      quoteNumber:
        safeStr(payload.quoteNumber) ||
        existing?.quoteNumber ||
        "",

      customerId:
        safeStr(payload.customerId) ||
        existing?.customerId ||
        null,

      customer,

      clientName:
        safeStr(payload.clientName) ||
        existing?.clientName ||
        customer.fullName,

      projectAddress:
        safeStr(payload.projectAddress) ||
        existing?.projectAddress ||
        (customer.unit ? `${customer.address}, ${customer.unit}` : customer.address),

      email:
        safeStr(payload.email) ||
        existing?.email ||
        customer.email,

      phone:
        safeStr(payload.phone) ||
        existing?.phone ||
        customer.phone,

      jobType:
        safeStr(payload.jobType) ||
        existing?.jobType ||
        "",

      status,
      paymentStatus,

      dueDate: safeStr(payload.dueDate) || existing?.dueDate || null,
      sentAt: payload.sentAt || existing?.sentAt || null,
      paidAt:
        paymentStatus === "paid"
          ? (existing?.paidAt || now)
          : (payload.paidAt || existing?.paidAt || null),

      notes:
        typeof payload.notes === "string"
          ? payload.notes
          : (existing?.notes || ""),

      terms:
        typeof payload.terms === "string"
          ? payload.terms
          : (existing?.terms || ""),

      termsVersion:
        payload.termsVersion || existing?.termsVersion || null,

      estimatorData:
        payload.estimatorData || existing?.estimatorData || null,

      lineItems,
      subtotal,
      tax,
      grandTotal,
      depositPaid,
      balanceDue,
    };

    await invoicesStore.setJSON(id, invoice);

    await invoicesIndexStore.setJSON(id, {
      id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      linkedQuoteId: invoice.linkedQuoteId,
      sourceQuoteId: invoice.sourceQuoteId,
      customerId: invoice.customerId,
      clientName: invoice.clientName,
      projectAddress: invoice.projectAddress,
      jobType: invoice.jobType,
      grandTotal: invoice.grandTotal,
      balanceDue: invoice.balanceDue,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate,
    });

    // Keep quote relationship synced if linked
    if (invoice.linkedQuoteId) {
      const quoteId = invoice.linkedQuoteId;
      const quote = await quotesStore.get(quoteId, { type: "json" });

      if (quote) {
        const updatedQuote = {
          ...quote,
          linkedInvoiceId: id,
          invoiceCreatedAt: quote.invoiceCreatedAt || now,
          updatedAt: now,
        };

        await quotesStore.setJSON(quoteId, updatedQuote);
      }

      const quoteIndex = await quotesIndexStore.get(quoteId, { type: "json" });
      if (quoteIndex) {
        await quotesIndexStore.setJSON(quoteId, {
          ...quoteIndex,
          linkedInvoiceId: id,
          invoiceCreatedAt: quoteIndex.invoiceCreatedAt || now,
        });
      }
    }

    return json(200, {
      ok: true,
      id,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (err) {
    console.error("save-invoice crashed:", err);
    return json(500, {
      error: "save-invoice failed",
      message: err?.message || String(err),
    });
  }
};