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
    console.log("create-deposit-checkout called", {
      method: event.httpMethod,
      hasBody: !!event.body,
    });

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    const publicSiteUrl = safeStr(process.env.PUBLIC_SITE_URL).replace(/^["']|["']$/g, "");

    console.log("env check", {
      hasStripeKey: !!stripeKey,
      hasSiteID: !!siteID,
      hasToken: !!token,
      publicSiteUrl,
    });

    if (!stripeKey || !siteID || !token || !publicSiteUrl) {
      return json(500, {
        error: "Missing required environment variables",
        hasStripeKey: !!stripeKey,
        hasSiteID: !!siteID,
        hasToken: !!token,
        hasPublicSiteUrl: !!publicSiteUrl,
      });
    }

    const stripe = new Stripe(stripeKey);
    const quotes = getStore("quotes", { siteID, token });

    let parsed;
    try {
      parsed = JSON.parse(event.body || "{}");
    } catch (e) {
      return json(400, { error: "Invalid JSON body" });
    }

    const { id, t } = parsed;
    const quoteId = safeStr(id);
    const publicToken = safeStr(t);

    console.log("request body parsed", { quoteId, t: publicToken });

    if (!quoteId) {
      return json(400, { error: "Missing quote id" });
    }

    const quote = await quotes.get(quoteId, { type: "json" });

    console.log("quote loaded", {
      found: !!quote,
      status: quote?.status,
      grandTotal: quote?.grandTotal,
      depositPaid: quote?.depositPaid,
      email: quote?.email,
    });

    if (!quote) {
      return json(404, { error: "Quote not found" });
    }

    if (quote.status !== "approved") {
      return json(400, {
        error: "Quote must be approved before deposit payment.",
        status: quote.status,
      });
    }

    if (quote.depositPaid === true || quote.depositStatus === "paid") {
      return json(400, { error: "Deposit already paid" });
    }

  const total = Number(quote.grandTotal || 0);
  const depositPercent = Number(quote.depositPercent || 0.4);
  const depositRequired = Math.round(total * depositPercent * 100) / 100;

  // Stripe processing fee (3.5%)
  const feePercent = 0.035;
  const processingFee = Math.round(depositRequired * feePercent * 100) / 100;

  // Total charged to customer
  const stripeChargeTotal =
    Math.round((depositRequired + processingFee) * 100) / 100;

    console.log("deposit calc", {
      total,
      depositPercent,
      depositRequired,
    });

    if (!(depositRequired > 0)) {
      return json(400, {
        error: "Invalid deposit amount",
        total,
        depositPercent,
        depositRequired,
      });
    }

    const customerName =
      safeStr(quote.clientName) ||
      `${safeStr(quote.customer?.firstName)} ${safeStr(quote.customer?.lastName)}`.trim() ||
      "Customer";

    const baseUrl = publicSiteUrl.replace(/\/$/, "");

    const successUrl =
      `${baseUrl}/quote/${encodeURIComponent(quoteId)}` +
      `?deposit=success` +
      `${publicToken ? `&t=${encodeURIComponent(publicToken)}` : ""}` +
      `&session_id={CHECKOUT_SESSION_ID}`;
    if (publicToken) successUrl.searchParams.set("t", publicToken);

    const cancelUrl =
      `${baseUrl}/quote/${encodeURIComponent(quoteId)}` +
      `?deposit=cancel` +
      `${publicToken ? `&t=${encodeURIComponent(publicToken)}` : ""}`;
    if (publicToken) cancelUrl.searchParams.set("t", publicToken);

    console.log("Stripe redirect URLs:", {
      baseUrl,
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
    });

    console.log("creating stripe session", {
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      customerName,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      customer_email: safeStr(quote.email) || undefined,

      metadata: {
        quoteId,
        token: publicToken,
        type: "deposit_checkout",
      },

      payment_intent_data: {
        description: `Deposit for quote ${quote.quoteNumber || quoteId} - ${customerName}`,
        metadata: {
          quoteId,
          token: publicToken,
          type: "quote_deposit",
        },
      },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(stripeChargeTotal * 100),
            product_data: {
              name: `Deposit for Quote ${quote.quoteNumber || quoteId}`,
              description: `Deposit ${depositRequired.toFixed(
                2
              )} + card processing fee ${processingFee.toFixed(2)}`,
            },
          },
        },
      ],
    });

    console.log("stripe session created", {
      sessionId: session.id,
      hasUrl: !!session.url,
    });

    await quotes.setJSON(quoteId, {
      ...quote,
      depositPercent,
      depositRequired,
      depositProcessingFee: processingFee,
      depositStripeChargeTotal: stripeChargeTotal,
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
    console.error("create-deposit-checkout failed:", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      raw: err?.raw,
      stack: err?.stack,
    });

    return json(500, {
      error: "create-deposit-checkout failed",
      message: err?.message || String(err),
      type: err?.type || null,
      code: err?.code || null,
    });
  }
};