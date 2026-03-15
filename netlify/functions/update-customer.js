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

function requireAuth(context) {
  const user = context?.clientContext?.user;
  return user || null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;

    if (!siteID || !token) {
      return json(500, {
        error: "Missing env vars for Blobs",
        hasSiteId: !!siteID,
        hasAuthToken: !!token,
      });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const id = safeStr(payload.id);
    if (!id) {
      return json(400, { error: "Customer id is required" });
    }

    const firstName = safeStr(payload.firstName);
    const lastName = safeStr(payload.lastName);
    const address = safeStr(payload.address);
    const unit = safeStr(payload.unit);
    const email = safeStr(payload.email);
    const phone = safeStr(payload.phone);

    if (!firstName || !lastName || !address) {
      return json(400, {
        error: "First name, last name, and address are required",
      });
    }

    if (email && !isValidEmail(email)) {
      return json(400, { error: "Invalid email address" });
    }

    const customersStore = getStore("customers", { siteID, token });
    const customersIndexStore = getStore("customers_index", { siteID, token });

    const existing = await customersStore.get(id, { type: "json" });
    if (!existing) {
      return json(404, { error: "Customer not found" });
    }

    const now = new Date().toISOString();

    const customer = {
      ...existing,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      address,
      unit,
      email,
      phone,
      updatedAt: now,
      updatedBy: {
        id: user.sub,
        email: user.email,
      },
    };

    await customersStore.setJSON(id, customer);

    await customersIndexStore.setJSON(id, {
      ...customer,
    });

    return json(200, { ok: true, customer });
  } catch (err) {
    console.error("update-customer crashed:", err);
    return json(500, {
      error: "update-customer failed",
      message: err?.message || String(err),
    });
  }
};