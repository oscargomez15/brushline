// quote-pdf (patched)
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
  return safeStr(quote.viewToken) && safeStr(quote.viewToken) === safeStr(t);
}

function requireAuth(context) {
  return context?.clientContext?.user || null;
}

exports.handler = async (event, context) => {
  try {
    const method = event.httpMethod;
    const id = safeStr(event.queryStringParameters?.id);
    const t = safeStr(event.queryStringParameters?.t);
    const force = safeStr(event.queryStringParameters?.force).toLowerCase() === "1" ||
                  safeStr(event.queryStringParameters?.force).toLowerCase() === "true";

    if (!id) return json(400, { error: "Missing id" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });

    const quotesStore = getStore("quotes", { siteID, token });
    const pdfsStore = getStore("quotes_pdfs", { siteID, token });

    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // auth: token OR logged-in user
    if (t) {
      if (!tokenMatches(quote, t)) return json(403, { error: "Invalid token" });
    } else {
      const user = requireAuth(context);
      if (!user) return json(401, { error: "Unauthorized" });
    }

    // POST -> explicit regenerate (requires auth/token)
    if (method === "POST") {
      // Always regenerate on POST
      const newPdfBase64 = await buildQuotePdfBase64(quote);
      await pdfsStore.set(id, newPdfBase64); // overwrite
      const filename = `Quote-${quote.quoteNumber || quote.id}.pdf`;
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
        body: newPdfBase64,
        isBase64Encoded: true,
      };
    }

    // GET -> return stored pdf unless force=true
    if (method === "GET") {
      let pdfBase64 = null;
      if (!force) {
        try {
          pdfBase64 = await pdfsStore.get(id, { type: "text" });
        } catch (err) {
          // ignore and fallback to regenerate
          pdfBase64 = null;
        }
      }

      if (!pdfBase64) {
        pdfBase64 = await buildQuotePdfBase64(quote);
        await pdfsStore.set(id, pdfBase64); // store new one
      }

      const filename = `Quote-${quote.quoteNumber || quote.id}.pdf`;

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
        body: pdfBase64,
        isBase64Encoded: true,
      };
    }

    return json(405, { error: "Method not allowed" });
  } catch (e) {
    console.error("quote-pdf failed:", e);
    return json(500, { error: "quote-pdf failed", message: e?.message || String(e) });
  }
};