const { getStore } = require("@netlify/blobs");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireAuth(context) {
  const user = context?.clientContext?.user;
  return user || null;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    // ✅ Auth
    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    // ✅ Env vars (must be inside handler)
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    // ✅ Store configured with siteID/token
    const store = getStore("quotes", { siteID, token });

    // ✅ Parse body
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    // ✅ Validate
    const { jobType, grandTotal } = payload;

    if (!jobType || !["interior", "exterior"].includes(jobType)) {
      return json(400, { error: "jobType must be 'interior' or 'exterior'" });
    }

    // NOTE: if grandTotal is coming as a string from the UI,
    // parse it before validation:
    const totalNumber = typeof grandTotal === "string" ? parseFloat(grandTotal) : grandTotal;

    if (!Number.isFinite(totalNumber)) {
      return json(400, { error: "grandTotal must be a number" });
    }

    const id = makeId();

    const quote = {
      id,
      createdAt: new Date().toISOString(),
      createdBy: { id: user.sub, email: user.email },
      ...payload,
      grandTotal: totalNumber,
    };

    await store.setJSON(id, quote);

    return json(200, { id, url: `/quote/${id}` });
  } catch (err) {
    console.error("create-quote crashed:", err);
    return json(500, { error: "create-quote failed", message: err?.message || String(err) });
  }
};
