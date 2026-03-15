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

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, { error: "Missing Blobs env vars" });
    }

    const id = safeStr(event.queryStringParameters?.id);
    const t = safeStr(event.queryStringParameters?.t);

    if (!id || !t) {
      return json(400, { error: "Missing invoice id or token" });
    }

    const invoicesStore = getStore("invoices", { siteID, token });
    const invoice = await invoicesStore.get(id, { type: "json" });

    if (!invoice) {
      return json(404, { error: "Invoice not found" });
    }

    if (safeStr(invoice.viewToken) !== t) {
      return json(403, { error: "Invalid token" });
    }

    const safeInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      clientName: invoice.clientName,
      projectAddress: invoice.projectAddress,
      email: invoice.email,
      phone: invoice.phone,
      companyName: invoice.companyName,
      jobType: invoice.jobType,
      status: invoice.status,
      paymentStatus: invoice.paymentStatus,
      lineItems: invoice.lineItems || [],
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      grandTotal: invoice.grandTotal || 0,
      depositPaid: invoice.depositPaid || 0,
      balanceDue: invoice.balanceDue || 0,
      notes: invoice.notes || "",
      terms: invoice.terms || "",
      linkedQuoteId: invoice.linkedQuoteId || "",
      payments: Array.isArray(invoice.payments)
        ? invoice.payments.map((p) => ({
            id: p.id,
            amount: Number(p.amount) || 0,
            method: p.method || "",
            note: p.note || "",
            paidAt: p.paidAt || p.recordedAt || null,
            }))
        : [],
    };

    await invoicesStore.setJSON(id, {
      ...invoice,
      viewedAt: new Date().toISOString(),
      viewedBy: "customer",
    });

    return json(200, safeInvoice);
  } catch (err) {
    console.error("get-public-invoice crashed:", err);
    return json(500, {
      error: "get-public-invoice failed",
      message: err?.message || String(err),
    });
  }
};