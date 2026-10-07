const { getStore } = require("@netlify/blobs");

const safeStr = (value, max = 3000) => String(value || "").trim().slice(0, max);

function getLeadsStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) throw new Error("Missing env vars for Blobs");
  return getStore("website_leads", { siteID, token });
}

async function listAllLeads(store) {
  const { blobs } = await store.list();
  const leads = (await Promise.all(blobs.map((blob) => store.get(blob.key, { type: "json" })))).filter(Boolean);
  return leads.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

module.exports = { safeStr, getLeadsStore, listAllLeads };
