const { getStore } = require("@netlify/blobs");
const { buildQuotePdfBase64 } = require("./_pdf");

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

function tokenMatches(quote, t) {
  return safeStr(quote?.viewToken) && safeStr(quote.viewToken) === safeStr(t);
}

function requireAuth(context) {
  return context?.clientContext?.user || null;
}

function recalcHandymanTotal(lineItems) {
  return (Array.isArray(lineItems) ? lineItems : []).reduce((sum, item) => {
    if (item?.excluded) return sum;
    return sum + (Number(item?.price) || 0);
  }, 0);
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const body = JSON.parse(event.body || "{}");
    const id = safeStr(body.id);
    const t = safeStr(body.t);
    const lineIndex = Number(body.lineIndex);

    if (!id) {
      return json(400, { error: "Missing quote id" });
    }

    if (!Number.isInteger(lineIndex)) {
      return json(400, { error: "Missing or invalid lineIndex" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    const quotesStore = getStore("quotes", { siteID, token });
    const indexStore = getStore("quotes_index", { siteID, token });
    const pdfStore = getStore("quotes_pdfs", { siteID, token });

    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) {
      return json(404, { error: "Quote not found" });
    }

    if (t) {
      if (!tokenMatches(quote, t)) {
        return json(403, { error: "Invalid token" });
      }
    } else {
      const user = requireAuth(context);
      if (!user) {
        return json(401, { error: "Unauthorized" });
      }
    }

    if (quote.jobType !== "handyman") {
      return json(400, { error: "Only handyman quotes support this action" });
    }

    const currentItems = Array.isArray(quote.lineItems) ? [...quote.lineItems] : [];
    if (lineIndex < 0 || lineIndex >= currentItems.length) {
      return json(400, { error: "Line item not found" });
    }

    currentItems[lineIndex] = {
      ...currentItems[lineIndex],
      excluded: !currentItems[lineIndex]?.excluded,
    };

    const activeCount = currentItems.filter((item) => !item.excluded).length;
    if (activeCount === 0) {
      return json(400, { error: "Quote must keep at least one active line item" });
    }

    const newGrandTotal = recalcHandymanTotal(currentItems);

    const updatedQuote = {
      ...quote,
      lineItems: currentItems,
      grandTotal: newGrandTotal,
      updatedAt: new Date().toISOString(),
      status: "awaiting_approval",
      approvedAt: null,
      signature: null,
    };

    await quotesStore.setJSON(id, updatedQuote);

    await indexStore.setJSON(id, {
      id,
      customerId: updatedQuote.customerId || null,
      createdAt: updatedQuote.createdAt,
      updatedAt: updatedQuote.updatedAt,
      jobType: updatedQuote.jobType,
      grandTotal: updatedQuote.grandTotal,
      clientName: updatedQuote.clientName || updatedQuote.customer?.fullName || "",
      projectAddress: updatedQuote.projectAddress || updatedQuote.customer?.address || "",
      status: updatedQuote.status || "awaiting_approval",
      approvedAt: updatedQuote.approvedAt || null,
    });

    const pdfBase64 = await buildQuotePdfBase64(updatedQuote);
    await pdfStore.set(id, pdfBase64);

    return json(200, {
      ok: true,
      quote: updatedQuote,
    });
  } catch (err) {
    console.error("toggle-quote-line-item failed:", err);
    return json(500, {
      error: "toggle-quote-line-item failed",
      message: err?.message || String(err),
    });
  }
};