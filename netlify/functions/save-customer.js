const {
  safeStr,
  normalizePhone,
  requireAuth,
  getCustomersStore,
  toCustomerRecord,
  listAllCustomers,
} = require("./_customers");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const user = requireAuth(context);
    if (!user) return json(401, { error: "Unauthorized" });

    const body = JSON.parse(event.body || "{}");

    const firstName = safeStr(body.firstName);
    const lastName = safeStr(body.lastName);
    const address = safeStr(body.address);
    const email = safeStr(body.email);
    const phone = safeStr(body.phone);
    const id = safeStr(body.id);
    const unit = safeStr(body.unit);

    if (!firstName || !lastName) {
      return json(400, { error: "First and last name are required" });
    }

    const store = getCustomersStore();

    let existing = null;

    if (id) {
      existing = await store.get(id, { type: "json" });
      if (!existing) return json(404, { error: "Customer not found" });
    } else {
      const all = await listAllCustomers(store);
      const emailLower = email.toLowerCase();
      const phoneDigits = normalizePhone(phone);

      existing =
        all.find((c) => emailLower && c.email?.toLowerCase() === emailLower) ||
        all.find((c) => phoneDigits && c.phoneDigits === phoneDigits) ||
        all.find(
          (c) =>
            c.fullName?.toLowerCase() === `${firstName} ${lastName}`.trim().toLowerCase() &&
            safeStr(c.address).toLowerCase() === address.toLowerCase()
        ) ||
        null;
    }

    const customer = toCustomerRecord(body, existing);
    await store.set(customer.id, JSON.stringify(customer));

    return json(200, { ok: true, customer });
  } catch (e) {
    console.error("save-customer failed:", e);
    return json(500, { error: "save-customer failed", message: e?.message || String(e) });
  }
};