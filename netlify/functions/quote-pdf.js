const { getStore } = require("@netlify/blobs");
const PDFDocument = require("pdfkit");
const pdfStore = getStore("quotes_pdfs", { siteID, token });

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function safeStr(v) {
  return (v || "").toString().trim();
}

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
}

function buildPdfBuffer(quote) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 40 });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const company = quote.companyName || "Brushline Services";
      const customer =
        quote.clientName ||
        quote.customer?.fullName ||
        `${quote.customer?.firstName || ""} ${quote.customer?.lastName || ""}`.trim();
      const address = quote.projectAddress || quote.customer?.address || "";
      const created = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "";
      const proposalNum = quote.quoteNumber || quote.id;

      const serviceLabel =
        quote.jobType === "exterior"
          ? "Exterior Painting"
          : quote.jobType === "handyman"
            ? "Handyman / Misc"
            : "Interior Painting";

      // Header
      doc.fontSize(18).text(company);
      doc.fontSize(11).fillColor("#555").text("Proposal", { align: "right" });
      doc.fillColor("#000").moveDown(1);

      // Meta
      doc.fontSize(10).text(`Proposal #: ${proposalNum}`);
      doc.text(`Date: ${created}`);
      doc.text(`Service: ${serviceLabel}`);
      doc.moveDown(0.6);

      doc.fontSize(10).text(`Prepared For: ${customer}`);
      doc.text(`Project Location: ${address}`);
      doc.moveDown(1);

      // Handyman table
      if (quote.jobType === "handyman" && Array.isArray(quote.lineItems) && quote.lineItems.length) {
        doc.fontSize(12).text("Service Details");
        doc.moveDown(0.3);

        // Table header
        const y = doc.y;
        doc.fontSize(10).fillColor("#444").text("Service", 40, y, { width: 420 });
        doc.text("Price", 460, y, { width: 120, align: "right" });
        doc.fillColor("#000");
        doc.moveDown(0.3);

        quote.lineItems.forEach((it) => {
          const rowY = doc.y;
          doc.fontSize(10).text(it.description || "", 40, rowY, { width: 420 });
          doc.text(fmtMoney(it.price), 460, rowY, { width: 120, align: "right" });
          doc.moveDown(0.2);
        });

        doc.moveDown(0.6);
      }

      // Painting scope
      if (Array.isArray(quote.scopeItems) && quote.scopeItems.length) {
        doc.fontSize(12).text("Scope of Work");
        doc.moveDown(0.3);

        quote.scopeItems.forEach((area) => {
          doc.fontSize(11).text(area.areaName || "Area", { underline: true });
          doc.fontSize(10).text(`Areas: ${(area.scope || []).join(", ") || "N/A"}`);

          if (Array.isArray(area.extras) && area.extras.length) {
            doc.moveDown(0.15);
            doc.fontSize(10).text("Additional work:");
            area.extras.forEach((x) => doc.text(`• ${x.label} — ${fmtMoney(x.price)}`));
          }
          doc.moveDown(0.5);
        });
      }

      // Totals
      const total = Number(quote.grandTotal) || 0;
      const deposit = Math.round(total * 0.4 * 100) / 100;

      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total: ${fmtMoney(total)}`, { align: "right" });
      doc.fontSize(10).fillColor("#555").text(`Deposit (40%): ${fmtMoney(deposit)}`, { align: "right" });
      doc.fillColor("#000").moveDown(1);

      // Terms (optional – you can shorten if it’s too long)
      if (quote.terms) {
        doc.fontSize(12).text("Terms of Service");
        doc.moveDown(0.3);
        doc.fontSize(9).fillColor("#333").text(String(quote.terms), { width: 540 });
        doc.fillColor("#000");
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Customer: allow with token t
function tokenMatches(quote, t) {
  return safeStr(quote.viewToken) && safeStr(quote.viewToken) === safeStr(t);
}

// Admin: require Netlify Identity user
function requireAuth(context) {
  return context?.clientContext?.user || null;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const id = safeStr(event.queryStringParameters?.id);
    const t = safeStr(event.queryStringParameters?.t);

    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });

    const store = getStore("quotes", { siteID, token });
    const quote = await store.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // ✅ Access rule:
    // - If token `t` is provided and matches, allow (customer)
    // - Else require authenticated admin
    if (t) {
      if (!tokenMatches(quote, t)) return json(403, { error: "Invalid token" });
    } else {
      const user = requireAuth(context);
      if (!user) return json(401, { error: "Unauthorized" });
    }

    const pdf = await buildPdfBuffer(quote);

    const filename = `Quote-${quote.quoteNumber || quote.id}.pdf`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error("quote-pdf failed:", e);
    return json(500, { error: "quote-pdf failed", message: e?.message || String(e) });
  }
};