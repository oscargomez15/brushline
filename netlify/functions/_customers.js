const { getStore } = require("@netlify/blobs");

function safeStr(v) {
  return (v || "").toString().trim();
}

function normalizePhone(v) {
  return safeStr(v).replace(/\D/g, "");
}

function buildFullName(firstName, lastName) {
  return `${safeStr(firstName)} ${safeStr(lastName)}`.trim();
}

function buildCustomerSearchText(customer) {
  return [
    customer.id,
    customer.firstName,
    customer.lastName,
    customer.fullName,
    customer.email,
    customer.phone,
    customer.address,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function requireAuth(context) {
  return context?.clientContext?.user || null;
}

function getCustomersStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    throw new Error("Missing env vars for Blobs");
  }

  return getStore("customers", { siteID, token });
}

function toCustomerRecord(input, existing = null) {
  const firstName = safeStr(input.firstName);
  const lastName = safeStr(input.lastName);
  const fullName = buildFullName(firstName, lastName);
  const now = new Date().toISOString();

const customer = {
  id: existing?.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  firstName,
  lastName,
  fullName,
  email: safeStr(input.email),
  phone: safeStr(input.phone),
  address: safeStr(input.address),
  unit: safeStr(input.unit),
  notes: safeStr(input.notes),
  createdAt: existing?.createdAt || now,
  updatedAt: now,
};

  customer.searchText = buildCustomerSearchText(customer);
  customer.phoneDigits = normalizePhone(customer.phone);

  return customer;
}

async function listAllCustomers(store) {
  const out = [];
  const { blobs } = await store.list();

  for (const blob of blobs) {
    const customer = await store.get(blob.key, { type: "json" });
    if (customer) out.push(customer);
  }

  out.sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  return out;
}

module.exports = {
  safeStr,
  normalizePhone,
  buildFullName,
  buildCustomerSearchText,
  requireAuth,
  getCustomersStore,
  toCustomerRecord,
  listAllCustomers,
};