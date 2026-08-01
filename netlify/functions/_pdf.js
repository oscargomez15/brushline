// netlify/functions/_pdf.js
const { getStore } = require("@netlify/blobs");
const PDFDocument = require("pdfkit");
const { getQuoteNumber } = require("./_quote-number");
const path = require("path");
const fs = require("fs");

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
}

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;

  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (!match) return null;

  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

async function getSignatureBufferFromQuote(quote) {
  try {
    const key = quote?.signature?.key;
    if (!key) return null;

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return null;

    const signaturesStore = getStore("quote_signatures", { siteID, token });
    const arr = await signaturesStore.get(key, { type: "arrayBuffer" });
    if (!arr) return null;

    return Buffer.from(arr);
  } catch (e) {
    console.warn("Failed to load signature buffer:", e?.message || e);
    return null;
  }
}

function resolveLogoPath() {
  const candidates = [
    path.join(__dirname, "assets", "logo.png"),
    path.join(__dirname, "..", "assets", "logo.png"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function truncateTerms(terms, max = 3000) {
  const t = String(terms || "");
  if (t.length <= max) return t;
  return t.slice(0, max) + "\n\n(Full terms available in the online quote.)";
}

function buildQuotePdfBuffer(quote) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 40 });
      const chunks = [];

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ---------- CRM-STYLE HEADER ----------
        const leftX = 40;
        const rightX = 320;
        const topY = 26;

        doc.roundedRect(leftX, topY, 530, 70, 8).fill("#0B1633");

        const logoPath = resolveLogoPath();
        if (logoPath) {
        try {
            const logoBuf = fs.readFileSync(logoPath); // ✅ more reliable on Netlify
            doc.image(logoBuf, leftX, topY, {
            fit: [160, 70],   // ✅ controls max width/height
            align: "left",
            valign: "top",
            });
        } catch (e) {
            console.warn("Logo render failed:", e?.message || e);
        }
        } else {
        console.warn("Logo not found");
        }

        const headerBottomY = topY + 78;

        doc.x = leftX;
        doc.y = headerBottomY + 15;

      const statusText = quote.status === "approved" ? "APPROVED" : "AWAITING APPROVAL";
      const serviceLabel =
        quote.jobType === "exterior"
          ? "Exterior Painting"
          : quote.jobType === "handyman"
            ? "Handyman / Misc"
            : quote.jobType === "drywall"
              ? "Drywall Installation / Repair"
            : "Interior Painting";

      doc.fontSize(19).fillColor("#FFFFFF").text("PROPOSAL", rightX, topY + 11, { align: "right", width: 230 });
      doc.fontSize(9).fillColor("#BFDBFE").text(statusText, rightX, topY + 36, { align: "right", width: 230 });
      doc.fontSize(9).fillColor("#E2E8F0").text(serviceLabel, rightX, topY + 50, { align: "right", width: 230 });
      doc.fillColor("#000");

      doc.x = leftX;
      doc.y = topY + 85;
      // ---------- END HEADER ----------


      // Meta
      const proposalNum = getQuoteNumber(quote);
      const created = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "";
      const customer =
        quote.clientName ||
        quote.customer?.fullName ||
        `${quote.customer?.firstName || ""} ${quote.customer?.lastName || ""}`.trim();
      const projectAddress = quote.projectAddress || quote.customer?.address || "";

      const metaY = doc.y;
      doc.roundedRect(leftX, metaY, 530, 82, 7).fillAndStroke("#F8FAFC", "#E2E8F0");
      doc.fontSize(9).fillColor("#2563EB").text("PREPARED FOR", leftX + 14, metaY + 13);
      doc.fontSize(13).fillColor("#0F172A").text(customer || "Customer", leftX + 14, metaY + 27, { width: 300 });
      doc.fontSize(9).fillColor("#64748B").text(projectAddress || "No project address", leftX + 14, metaY + 46, { width: 300 });
      doc.fontSize(9).fillColor("#64748B").text(`Proposal #  ${proposalNum}`, rightX, metaY + 17, { align: "right", width: 230 });
      doc.text(`Issued  ${created}`, rightX, metaY + 36, { align: "right", width: 230 });
      doc.y = metaY + 98;
      doc.fillColor("#000");

      // Handyman
      if (Array.isArray(quote.lineItems) && quote.lineItems.length) {
        doc.fontSize(10).fillColor("#2563EB").text("SCOPE OF WORK", 40, doc.y, { characterSpacing: 1 });
        doc.moveDown(0.5);

        quote.lineItems.forEach((it) => {
          const rowY = doc.y;
          const title = it.title || "Work item";
          const description = it.description || "";
          doc.fontSize(11).fillColor("#0F172A").text(title, 52, rowY, { width: 410 });
          if (description) doc.fontSize(9).fillColor("#64748B").text(description, 52, doc.y + 3, { width: 410, lineGap: 2 });
          const contentBottom = doc.y;
          doc.fontSize(11).fillColor("#0F172A").text(fmtMoney(it.price), 470, rowY, { width: 88, align: "right" });
          doc.moveTo(40, Math.max(contentBottom, rowY + 18) + 8).lineTo(570, Math.max(contentBottom, rowY + 18) + 8).strokeColor("#E2E8F0").stroke();
          doc.y = Math.max(contentBottom, rowY + 18) + 18;
        });

        doc.moveDown(0.3);
        const summaryY = doc.y;
        doc.roundedRect(370, summaryY, 200, 42, 7).fill("#EFF6FF");
        doc.fontSize(10).fillColor("#475569").text("Estimate Total", 384, summaryY + 15, { width: 90 });
        doc.fontSize(15).fillColor("#0F172A").text(fmtMoney(quote.grandTotal), 466, summaryY + 12, { align: "right", width: 90 });
        doc.y = summaryY + 54;
        doc.x = 40;
        doc.moveDown(1);
      }

      // Painting scope
      if (Array.isArray(quote.scopeItems) && quote.scopeItems.length) {
        doc.fontSize(10).fillColor("#2563EB").text("SCOPE OF WORK", { characterSpacing: 1 });
        doc.moveDown(0.4);

        quote.scopeItems.forEach((area) => {
          doc.fontSize(11).text(area.areaName || "Area", { underline: true });
          doc.fontSize(10).text(`Areas: ${(area.scope || []).join(", ") || "N/A"}`);

          if (Array.isArray(area.extras) && area.extras.length) {
            doc.moveDown(0.2);
            doc.fontSize(10).text("Additional work:");
            area.extras.forEach((x) => doc.fontSize(10).text(`• ${x.label} — ${fmtMoney(x.price)}`));
          }
          doc.moveDown(0.6);
        });

        doc.fontSize(12).text(`Total: ${fmtMoney(quote.grandTotal)}`, { align: "right" });
        doc.moveDown(1);
      }

      // Deposit
      const deposit = Math.round((Number(quote.grandTotal) || 0) * 0.4 * 100) / 100;
      doc.fontSize(11).text(`Deposit (40%): ${fmtMoney(deposit)}`);
      doc.moveDown(1);

      // Terms (truncated)
      if (quote.terms) {
        const shortTerms = truncateTerms(quote.terms, 3000);
        doc.fontSize(12).text("Terms of Service");
        doc.moveDown(0.4);
        doc.fontSize(9).fillColor("#333").text(shortTerms, { width: 540 });
        doc.fillColor("#000");
      }

      doc.moveDown(0.5);
      doc.fontSize(8).fillColor("#666").text("For full terms, please refer to the online quote.");
      doc.fillColor("#000");

      // Signature / approval
    if (quote.status === "approved" && quote.signature?.key) {
      doc.moveDown(1);
      doc.fontSize(12).fillColor("#111").text("Client Approval");
      doc.moveDown(0.4);

      doc.fontSize(10).fillColor("#333");
      doc.text(`Signed By: ${quote.signature?.typedName || quote.clientName || "Client"}`);
      doc.text(
        `Date: ${quote.approvedAt ? new Date(quote.approvedAt).toLocaleString() : "—"}`
      );
      doc.moveDown(0.4);

      const sigBuffer = await getSignatureBufferFromQuote(quote);
      if (sigBuffer) {
        try {
          doc.image(sigBuffer, {
            fit: [180, 70],
            align: "left",
          });
          doc.moveDown(0.2);
          doc.moveTo(40, doc.y).lineTo(220, doc.y).strokeColor("#999").stroke();
          doc.moveDown(0.3);
        } catch (e) {
          console.warn("Signature render failed:", e?.message || e);
        }
      }

      doc.fillColor("#000");
    }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function buildQuotePdfBase64(quote) {
  const buf = await buildQuotePdfBuffer(quote);
  return buf.toString("base64");
}

module.exports = {
  buildQuotePdfBuffer,
  buildQuotePdfBase64,
};
