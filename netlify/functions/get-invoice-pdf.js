const { getStore } = require("@netlify/blobs");
const { buildInvoicePdfBase64 } = require("./_invoice-pdf");

function safeStr(v) {
  return (v || "").toString().trim();
}

function requireAuth(context) {
  const user = context?.clientContext?.user;
  return user || null;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        body: "Method not allowed",
      };
    }

    const user = requireAuth(context);
    if (!user) {
      return {
        statusCode: 401,
        body: "Unauthorized",
      };
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return {
        statusCode: 500,
        body: "Missing Blobs env vars",
      };
    }

    const id = safeStr(event.queryStringParameters?.id);
    if (!id) {
      return {
        statusCode: 400,
        body: "Missing invoice id",
      };
    }

    const invoicesStore = getStore("invoices", { siteID, token });
    const invoice = await invoicesStore.get(id, { type: "json" });

    if (!invoice) {
      return {
        statusCode: 404,
        body: "Invoice not found",
      };
    }

    const pdfBase64 = await buildInvoicePdfBase64(invoice);
    const fileName = `Invoice-${safeStr(invoice.invoiceNumber || invoice.id || "document")}.pdf`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
      body: pdfBase64,
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("get-invoice-pdf crashed:", err);
    return {
      statusCode: 500,
      body: err?.message || "Failed to generate invoice PDF",
    };
  }
};