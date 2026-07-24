const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }
    if (!context?.clientContext?.user) {
      return json(401, { error: "Unauthorized" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) {
      return json(500, { error: "Photo storage is not configured." });
    }

    const { dataUrl } = JSON.parse(event.body || "{}");
    const match = String(dataUrl || "").match(
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
    );
    if (!match) return json(400, { error: "Unsupported image format." });

    const contentType = match[1];
    const data = match[2];
    const size = Buffer.byteLength(data, "base64");
    if (size > 2 * 1024 * 1024) {
      return json(413, { error: "Photo is too large after compression." });
    }

    const id = crypto.randomUUID();
    const store = getStore("estimate_photos", { siteID, token });
    await store.setJSON(id, { contentType, data });

    return json(200, {
      id,
      url: `/.netlify/functions/get-estimate-photo?id=${encodeURIComponent(id)}`,
    });
  } catch (error) {
    console.error("upload-estimate-photo failed:", error);
    return json(500, { error: "Failed to upload photo." });
  }
};
