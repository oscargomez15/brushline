const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

function safeStr(v) {
  return (v || "").toString().trim();
}

function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US");
}

function prettyMethod(method = "") {
  const map = {
    cash: "Cash",
    check: "Check",
    zelle: "Zelle",
    card: "Card",
    stripe: "Stripe",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  return map[method] || method || "Payment";
}

function wrapText(text, maxChars = 90) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

const DEFAULT_INVOICE_TERMS = `
Payment is due upon receipt unless otherwise agreed in writing.
This invoice reflects the approved scope of work and any recorded payments received.
Additional work, changes, or materials outside the approved scope may be billed separately.
Thank you for choosing Brushline Services.
`.trim();

async function buildInvoicePdfBase64(invoice) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // letter
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let logoImage = null;
    try {
    const logoPath = path.join(__dirname, "assets", "logo.png");
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (err) {
    console.warn("Invoice PDF logo could not be loaded:", err?.message || err);
    }
  const colors = {
    navy: rgb(11 / 255, 22 / 255, 51 / 255),
    text: rgb(15 / 255, 23 / 255, 42 / 255),
    muted: rgb(100 / 255, 116 / 255, 139 / 255),
    border: rgb(226 / 255, 232 / 255, 240 / 255),
    soft: rgb(248 / 255, 250 / 255, 252 / 255),
    green: rgb(22 / 255, 163 / 255, 74 / 255),
  };

  const margin = 42;
  let y = height - margin;

  const lineItems = Array.isArray(invoice?.lineItems) ? invoice.lineItems : [];
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];

  const subtotal =
    Number(invoice?.subtotal) ||
    lineItems.reduce((sum, item) => sum + (Number(item?.total) || 0), 0);

  const tax = Number(invoice?.tax) || 0;
  const grandTotal = Number(invoice?.grandTotal) || subtotal + tax;
  const paymentsReceived = Number(invoice?.depositPaid) || 0;
  const balanceDue =
    invoice?.balanceDue !== undefined && invoice?.balanceDue !== null
      ? Number(invoice.balanceDue) || 0
      : Math.max(0, grandTotal - paymentsReceived);

  const drawText = (text, x, yPos, size = 11, bold = false, color = colors.text) => {
    page.drawText(String(text || ""), {
      x,
      y: yPos,
      size,
      font: bold ? fontBold : fontRegular,
      color,
    });
  };

  const drawRule = (yPos) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: colors.border,
    });
  };

  const ensureSpace = (needed = 80) => {
    if (y < margin + needed) {
      page = pdfDoc.addPage([612, 792]);
      y = height - margin;
    }
  };

  // Header
    const headerHeight = 60;
    const headerY = y - 56;
    const headerCenterY = headerY + headerHeight / 2;

    // Header background
    page.drawRectangle({
    x: margin,
    y: headerY,
    width: width - margin * 2,
    height: headerHeight,
    color: colors.navy,
    });

    // Logo
    if (logoImage) {
    const maxHeight = 28; // slightly smaller for better balance
    const scale = maxHeight / logoImage.height;
    const logoWidth = logoImage.width * scale;
    const logoHeight = logoImage.height * scale;

    const logoX = margin + 14;
    const logoY = headerCenterY - logoHeight / 2;

    page.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
    });
    }

    // Title
    const titleText = "INVOICE";
    const titleX = width - margin - 110;
    const titleY = headerCenterY - 6;

    page.drawText(titleText, {
    x: titleX,
    y: titleY,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
    });

    // Paid badge
    if (balanceDue <= 0) {
    const badgeWidth = 52;
    const badgeHeight = 16;
    const badgeX = width - margin - badgeWidth - 6;
    const badgeY = headerY + 8; // top-right inside header

    page.drawRectangle({
        x: badgeX,
        y: badgeY,
        width: badgeWidth,
        height: badgeHeight,
        color: colors.green,
        borderRadius: 3,
    });

    page.drawText("PAID", {
        x: badgeX + 13,
        y: badgeY + 4,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
    });
    }

    // Move below header before meta
    y = headerY - 24;

    // Top meta labels
    drawText("Invoice #", margin, y, 10, true, colors.muted);
    drawText("Issue Date", 220, y, 10, true, colors.muted);
    drawText("Due Date", 360, y, 10, true, colors.muted);

    y -= 16;

    // Top meta values
    drawText(invoice.invoiceNumber || "-", margin, y, 11, true);
    drawText(fmtDate(invoice.createdAt), 220, y, 11, true);
    drawText(invoice.dueDate || "Upon receipt", 360, y, 11, true);

    y -= 30;
    drawRule(y);
    y -= 24;

  // Bill to / from
  drawText("Bill To", margin, y, 11, true, colors.muted);
  drawText("From", 340, y, 11, true, colors.muted);

  y -= 18;
  drawText(invoice?.clientName || "Customer", margin, y, 14, true);
  drawText(invoice?.companyName || "Brushline Services", 340, y, 14, true);

  const leftLines = [
    invoice?.projectAddress || "—",
    invoice?.email || "",
    invoice?.phone || "",
  ].filter(Boolean);

  const rightLines = [
    "Brushline Services",
    "Professional Painting & Home Improvement",
  ];

  let localY = y - 18;
  leftLines.forEach((line) => {
    drawText(line, margin, localY, 11, false, colors.muted);
    localY -= 15;
  });

  let rightY = y - 18;
  rightLines.forEach((line) => {
    drawText(line, 340, rightY, 11, false, colors.muted);
    rightY -= 15;
  });

  y = Math.min(localY, rightY) - 10;
  drawRule(y);
  y -= 22;

  // Line items header
  page.drawRectangle({
    x: margin,
    y: y - 22,
    width: width - margin * 2,
    height: 22,
    color: colors.soft,
    borderColor: colors.border,
    borderWidth: 1,
  });

  drawText("Description", margin + 8, y - 14, 10, true, colors.muted);
  drawText("Qty", 360, y - 14, 10, true, colors.muted);
  drawText("Unit", 430, y - 14, 10, true, colors.muted);
  drawText("Total", 520, y - 14, 10, true, colors.muted);

  y -= 32;

  if (!lineItems.length) {
    drawText("No line items found.", margin + 8, y, 11, false, colors.muted);
    y -= 18;
  } else {
    for (const item of lineItems) {
      ensureSpace(40);

      const desc = safeStr(item?.description || item?.name || "Line item");
      const qty = Number(item?.qty ?? item?.quantity ?? 1) || 0;
      const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0) || 0;
      const total = Number(item?.total) || qty * unitPrice;

      const descLines = wrapText(desc, 48);
      const rowHeight = Math.max(20, descLines.length * 14);

      descLines.forEach((line, i) => {
        drawText(line, margin + 8, y - i * 14, 11, i === 0);
      });

      drawText(String(qty), 360, y, 11);
      drawText(fmtMoney(unitPrice), 430, y, 11);
      drawText(fmtMoney(total), 520, y, 11, true);

      y -= rowHeight;
      drawRule(y + 6);
      y -= 8;
    }
  }

  // Payment history directly after line items
    ensureSpace(70);
    y -= 6;

    drawText("Payment History", margin, y, 12, true, colors.muted);
    y -= 18;

    if (!payments.length) {
    drawText("No payments recorded.", margin, y, 11, false, colors.muted);
    y -= 18;
    } else {
    for (const payment of payments) {
        ensureSpace(30);

        const paidAt = fmtDate(payment?.paidAt || payment?.recordedAt);
        const method = prettyMethod(payment?.method);
        const amount = fmtMoney(payment?.amount);

        drawText(`${paidAt}  •  ${method}`, margin, y, 11, true);
        drawText(amount, 500, y, 11, true);

        if (payment?.note) {
        y -= 14;
        drawText(payment.note, margin, y, 10, false, colors.muted);
        }

        y -= 20;
    }
    }

    y -= 8;

    // Summary box after payment history
    ensureSpace(120);

    const boxWidth = 210;
    const boxHeight = 78;
    const boxX = width - margin - boxWidth;
    const boxY = y - boxHeight;

    page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: colors.soft,
    borderColor: colors.border,
    borderWidth: 1,
    });

    drawText("Total", boxX + 14, boxY + 52, 11, false, colors.muted);
    drawText(fmtMoney(grandTotal), boxX + 130, boxY + 52, 11, true);

    drawText("Payments Received", boxX + 14, boxY + 32, 11, false, colors.muted);
    drawText(fmtMoney(paymentsReceived), boxX + 130, boxY + 32, 11, true, colors.green);

    // divider only inside box
    page.drawLine({
    start: { x: boxX, y: boxY + 18 },
    end: { x: boxX + boxWidth, y: boxY + 18 },
    thickness: 1,
    color: colors.border,
    });

    drawText("Balance Due", boxX + 14, boxY + 6, 12, true);
    drawText(fmtMoney(balanceDue), boxX + 118, boxY + 6, 14, true);

    y = boxY - 24;

  // Notes
  if (invoice?.notes) {
    ensureSpace(70);
    drawText("Notes", margin, y, 12, true, colors.muted);
    y -= 16;
    wrapText(invoice.notes, 85).forEach((line) => {
      drawText(line, margin, y, 11, false, colors.muted);
      y -= 14;
    });
    y -= 8;
  }

  // Terms
const termsText = safeStr(invoice?.terms) || DEFAULT_INVOICE_TERMS;

if (termsText) {
  ensureSpace(90);
  drawRule(y + 4);
  y -= 10;

  drawText("Terms", margin, y, 12, true, colors.muted);
  y -= 16;

  const termLines = wrapText(termsText, 90);

  for (const line of termLines) {
    ensureSpace(24);
    drawText(line, margin, y, 10, false, colors.muted);
    y -= 13;
  }
}

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString("base64");
}

module.exports = { buildInvoicePdfBase64 };