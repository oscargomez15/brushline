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

function tokenMatches(quote, t) {
  return safeStr(quote?.viewToken) && safeStr(quote.viewToken) === safeStr(t);
}

function requireAuth(context) {
  return context?.clientContext?.user || null;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const id = safeStr(event.queryStringParameters?.id);
    const t = safeStr(event.queryStringParameters?.t);

    if (!id) {
      return json(400, { error: "Missing quote id" });
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
    const signaturesStore = getStore("quote_signatures", { siteID, token });

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

    const key = safeStr(quote?.signature?.key);
    if (!key) {
      return json(404, { error: "Signature not found" });
    }

    const sigBuffer = await signaturesStore.get(key, { type: "arrayBuffer" });
    if (!sigBuffer) {
      return json(404, { error: "Signature file missing" });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
      body: Buffer.from(sigBuffer).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("quote-signature failed:", err);
    return json(500, {
      error: "quote-signature failed",
      message: err?.message || String(err),
    });
  }
};