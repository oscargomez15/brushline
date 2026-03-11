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
      return json(405, { error: "Method not allowed" });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    const publicSiteUrl = process.env.PUBLIC_SITE_URL;

    if (!stripeKey || !siteID || !token || !publicSiteUrl) {
      return json(500, { error: "Missing required environment variables" });
    }

    const stripe = new Stripe(stripeKey);
    const quotes = getStore("quotes", { siteID, token });

    const { id, t } = JSON.parse(event.body || "{}");
    const quoteId = safeStr(id);

    if (!quoteId) {
      return json(400, { error: "Missing quote id" });
    }

    const quote = await quotes.get(quoteId, { type: "json" });
    if (!quote) {
      return json(404, { error: "Quote not found" });
    }

    if (quote.status !== "approved") {
      return json(400, { error: "Quote must be approved before deposit payment." });
    }

    const total = Number(quote.grandTotal || 0);
    const depositPercent = Number(quote.depositPercent || 0.4);
    const depositRequired =
      Math.round(total * depositPercent * 100) / 100;

    if (!(depositRequired > 0)) {
      return json(400, { error: "Invalid deposit amount" });
    }

    if (quote.depositPaid) {
      return json(400, { error: "Deposit already paid" });
    }

    const customerName =
      safeStr(quote.clientName) ||
      `${safeStr(quote.customer?.firstName)} ${safeStr(quote.customer?.lastName)}`.trim() ||
      "Customer";

    const successUrl = `${publicSiteUrl.replace(/\/$/, "")}/quote/${encodeURIComponent(
      quoteId
    )}?deposit=success${t ? `&t=${encodeURIComponent(t)}` : ""}`;

    const cancelUrl = `${publicSiteUrl.replace(/\/$/, "")}/quote/${encodeURIComponent(
      quoteId
    )}?deposit=cancel${t ? `&t=${encodeURIComponent(t)}` : ""}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: safeStr(quote.email) || undefined,
      metadata: {
        quoteId,
        type: "deposit_checkout",
      },
      payment_intent_data: {
        description: `Deposit for quote ${quote.quoteNumber || quoteId} - ${customerName}`,
        metadata: {
          quoteId,
          type: "quote_deposit",
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(depositRequired * 100),
            product_data: {
              name: `Deposit for Quote ${quote.quoteNumber || quoteId}`,
              description: quote.projectAddress || quote.customer?.address || "Project deposit",
            },
          },
        },
      ],
    });

    await quotes.setJSON(quoteId, {
      ...quote,
      depositPercent,
      depositRequired,
      depositCheckoutSessionId: session.id,
      updatedAt: new Date().toISOString(),
    });

    return json(200, {
      ok: true,
      url: session.url,
      sessionId: session.id,
      depositRequired,
    });
  } catch (err) {
    console.error("create-deposit-checkout failed:", err);
    return json(500, {
      error: "create-deposit-checkout failed",
      message: err?.message || String(err),
    });
  }
};