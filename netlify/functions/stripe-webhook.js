const Stripe = require("stripe");
const { getStore } = require("@netlify/blobs");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!stripeKey || !webhookSecret || !siteID || !token) {
    return json(500, { error: "Missing required environment variables" });
  }

  const stripe = new Stripe(stripeKey);

  let stripeEvent;
  try {
    const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return json(400, { error: "Invalid webhook signature" });
  }

  try {
    const quotes = getStore("quotes", { siteID, token });
    const indexStore = getStore("quotes_index", { siteID, token });

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const quoteId = session?.metadata?.quoteId;

      if (quoteId) {
        const quote = await quotes.get(quoteId, { type: "json" });
        if (quote) {
          const updatedQuote = {
            ...quote,
            depositPaid: true,
            depositPaidAt: new Date().toISOString(),
            depositCheckoutSessionId: session.id || quote.depositCheckoutSessionId || null,
            depositPaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            updatedAt: new Date().toISOString(),
          };

          await quotes.setJSON(quoteId, updatedQuote);

          const idx = await indexStore.get(quoteId, { type: "json" });
          if (idx) {
            await indexStore.setJSON(quoteId, {
              ...idx,
              depositPaid: true,
              depositPaidAt: updatedQuote.depositPaidAt,
            });
          }
        }
      }
    }

    return {
      statusCode: 200,
      body: "ok",
    };
  } catch (err) {
    console.error("stripe-webhook failed:", err);
    return json(500, {
      error: "stripe-webhook failed",
      message: err?.message || String(err),
    });
  }
};