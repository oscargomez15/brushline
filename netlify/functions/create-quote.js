const { getStore } = require("@netlify/blobs");

const store = getStore("quotes", {
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_AUTH_TOKEN,
});

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireAuth(context) {
  const user = context?.clientContext?.user;
  if (!user) return null;
  return user;
}

function makeId() {
  // quick unique id for URL. (You can swap to nanoid if you want.)
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  // ✅ Ensure the request is from a logged-in Netlify Identity user
  const user = requireAuth(context);
  if (!user) return json(401, { error: "Unauthorized" });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  // Basic validation (expand as needed)
  const { jobType, grandTotal } = payload;
  if (!jobType || !["interior", "exterior"].includes(jobType)) {
    return json(400, { error: "jobType must be 'interior' or 'exterior'" });
  }
  if (typeof grandTotal !== "number") {
    return json(400, { error: "grandTotal must be a number" });
  }

  const store = getStore("quotes");
  const id = makeId();

  const quote = {
    id,
    createdAt: new Date().toISOString(),
    createdBy: {
      id: user.sub,
      email: user.email,
    },
    ...payload,
  };

  await store.setJSON(id, quote);

  return json(200, {
    id,
    url: `/quote/${id}`,
  });
};
