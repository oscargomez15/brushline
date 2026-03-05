const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

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

function tokenMatches(quote, t) {
  return safeStr(quote.viewToken) && safeStr(quote.viewToken) === safeStr(t);
}

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function minutesBetween(aIso, bIso) {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  return Math.abs(a - b) / 60000;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars for Blobs" });

    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const id = safeStr(body.id);
    const t = safeStr(body.t);
    if (!id || !t) return json(400, { error: "Missing id or t" });

    const quotesStore = getStore("quotes", { siteID, token });
    const indexStore = getStore("quotes_index", { siteID, token });

    const quote = await quotesStore.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    if (!tokenMatches(quote, t)) return json(403, { error: "Invalid token" });

    const now = new Date().toISOString();
    const ua = safeStr(event.headers["user-agent"]);
    const ref = safeStr(event.headers["referer"] || event.headers["referrer"]);

    const rawIp =
      safeStr(event.headers["x-nf-client-connection-ip"]) ||
      safeStr((event.headers["x-forwarded-for"] || "").split(",")[0]) ||
      null;

    const ipHash = hashIp(rawIp);

    const viewEvents = Array.isArray(quote.viewEvents) ? quote.viewEvents : [];

    // ✅ Throttle: same visitor within N minutes won't create a new log entry
    const THROTTLE_MINUTES = 2;

    const lastSameVisitor = [...viewEvents]
      .reverse()
      .find((v) => safeStr(v?.ipHash) === safeStr(ipHash) && safeStr(v?.ua) === safeStr(ua));

    const isThrottled =
      lastSameVisitor?.at && minutesBetween(lastSameVisitor.at, now) < THROTTLE_MINUTES;

    let nextEvents = viewEvents;
    let nextCount = Number(quote.viewCount) || 0;

    if (!isThrottled) {
      nextEvents = [...viewEvents, { at: now, ipHash, ua, ref }];
      nextCount += 1;
    }

    const updatedQuote = {
      ...quote,
      viewEvents: nextEvents,
      viewCount: nextCount,
      viewedAt: now, // keep updated for "last viewed"
    };

    await quotesStore.setJSON(id, updatedQuote);

    // keep list page fast
    const prevIndex = await indexStore.get(id, { type: "json" }).catch(() => ({}));
    await indexStore.setJSON(id, {
      ...prevIndex,
      id,
      viewed: true,
      lastViewedAt: now,
      viewCount: nextCount,
    });

    return json(200, {
      ok: true,
      throttled: isThrottled,
      viewedAt: now,
      viewCount: nextCount,
    });
  } catch (e) {
    console.error("track-quote-view failed:", e);
    return json(500, { error: "track-quote-view failed", message: e?.message || String(e) });
  }
};