const Stripe = require("stripe");
const { getStore } = require("@netlify/blobs");

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

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!stripeKey || !siteID || !token) {
      return json(500, {
        ok: false,
        error: "Missing required environment variables",
      });
    }

    const stripe = new Stripe(stripeKey);
    const quotes = getStore("quotes", { siteID, token });

    let parsed;
    try {
      parsed = JSON.parse(event.body || "{}");
    } catch (e) {
      return json(400, { ok: false, error: "Invalid JSON body" });
    }

    const quoteId = safeStr(parsed.id);
    const publicToken = safeStr(parsed.t);
    const sessionId = safeStr(parsed.sessionId);

    if (!quoteId || !sessionId) {
      return json(400, {
        ok: false,
        error: "Missing quote id or sessionId",
      });
    }

    const quote = await quotes.get(quoteId, { type: "json" });

    if (!quote) {
      return json(404, { ok: false, error: "Quote not found" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return json(404, { ok: false, error: "Stripe session not found" });
    }

    if (safeStr(session.metadata?.quoteId) !== quoteId) {
      return json(400, {
        ok: false,
        error: "Session does not belong to this quote",
      });
    }

    if (safeStr(session.metadata?.token) !== publicToken) {
      return json(400, {
        ok: false,
        error: "Session token does not match",
      });
    }

    if (session.payment_status !== "paid") {
      return json(200, {
        ok: false,
        error: `Payment not completed. Status: ${session.payment_status}`,
      });
    }

    if (quote.depositPaid === true || quote.depositStatus === "paid") {
      return json(200, {
        ok: true,
        alreadyPaid: true,
        quote,
      });
    }

    const updatedQuote = {
      ...quote,
      depositPaid: true,
      depositStatus: "paid",
      depositPaidAt: new Date().toISOString(),
      depositCheckoutSessionId: session.id,
      depositPaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "",
      depositAmount: (Number(session.amount_total) || 0) / 100,
      updatedAt: new Date().toISOString(),
    };

    await quotes.setJSON(quoteId, updatedQuote);

    return json(200, {
      ok: true,
      quote: updatedQuote,
    });
  } catch (err) {
    console.error("confirm-deposit-payment failed:", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      raw: err?.raw,
      stack: err?.stack,
    });

    return json(500, {
      ok: false,
      error: err?.message || "Server error",
    });
  }
};