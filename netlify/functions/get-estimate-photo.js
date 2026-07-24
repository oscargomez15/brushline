const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    const id = String(event.queryStringParameters?.id || "").trim();
    if (!siteID || !token || !id) {
      return { statusCode: 400, body: "Missing photo information" };
    }

    const store = getStore("estimate_photos", { siteID, token });
    const photo = await store.get(id, { type: "json" });
    if (!photo?.data || !photo?.contentType) {
      return { statusCode: 404, body: "Photo not found" };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: photo.data,
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("get-estimate-photo failed:", error);
    return { statusCode: 500, body: "Failed to load photo" };
  }
};
