const { getStore } = require("@netlify/blobs");

let dashboardCache = null;
let dashboardCacheTime = 0;
const DASHBOARD_CACHE_MS = 30 * 1000;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function requireAuth(context) {
  return context?.clientContext?.user || null;
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") {
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

    if (
      dashboardCache &&
      Date.now() - dashboardCacheTime < DASHBOARD_CACHE_MS
    ) {
      return json(200, dashboardCache);
    }

    const indexStore = getStore("quotes_index", { siteID, token });
    const { blobs } = await indexStore.list();
    const items = (
      await Promise.all(
        blobs.map((blob) => indexStore.get(blob.key, { type: "json" }))
      )
    ).filter(Boolean);

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyApprovedCount = new Array(12).fill(0);

    let approvedRevenueYTD = 0;
    let approvedQuotesYTD = 0;

    let totalQuotesYTD = 0;
    let pendingQuotesYTD = 0;
    let declinedQuotesYTD = 0;
    let draftQuotesYTD = 0;

    const recentApprovedQuotes = [];

    for (const item of items) {
      const status = normalizeStatus(item.status);

      if (item.createdAt) {
        const createdDate = new Date(item.createdAt);

        if (
          !Number.isNaN(createdDate.getTime()) &&
          createdDate.getFullYear() === currentYear
        ) {
          totalQuotesYTD += 1;

          if (
            status === "awaiting_approval" ||
            status === "pending" ||
            status === "sent" ||
            status === "viewed"
          ) {
            pendingQuotesYTD += 1;
          } else if (status === "declined" || status === "rejected") {
            declinedQuotesYTD += 1;
          } else if (status === "draft") {
            draftQuotesYTD += 1;
          }
        }
      }

      if (status !== "approved") continue;
      if (!item.approvedAt) continue;

      const approvedDate = new Date(item.approvedAt);
      if (Number.isNaN(approvedDate.getTime())) continue;

      const amount = Number(item.grandTotal) || 0;

      recentApprovedQuotes.push({
        id: item.id,
        clientName: item.clientName || "Unnamed Client",
        grandTotal: amount,
        approvedAt: item.approvedAt,
        status: item.status,
      });

      if (approvedDate.getFullYear() !== currentYear) continue;

      const month = approvedDate.getMonth();
      monthlyRevenue[month] += amount;
      monthlyApprovedCount[month] += 1;

      approvedRevenueYTD += amount;
      approvedQuotesYTD += 1;
    }

    recentApprovedQuotes.sort((a, b) => {
      return new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime();
    });

    const revenueByMonth = monthLabels.map((label, i) => ({
      label,
      revenue: Math.round(monthlyRevenue[i] * 100) / 100,
      count: monthlyApprovedCount[i],
    }));

    const avgApprovedQuote =
      approvedQuotesYTD > 0
        ? Math.round((approvedRevenueYTD / approvedQuotesYTD) * 100) / 100
        : 0;

    const closingRateYTD =
      totalQuotesYTD > 0
        ? Math.round((approvedQuotesYTD / totalQuotesYTD) * 1000) / 10
        : 0;

    const dashboard = {
      year: currentYear,
      approvedRevenueYTD: Math.round(approvedRevenueYTD * 100) / 100,
      approvedQuotesYTD,
      avgApprovedQuote,
      revenueByMonth,
      totalQuotesYTD,
      pendingQuotesYTD,
      declinedQuotesYTD,
      draftQuotesYTD,
      closingRateYTD,
      recentApprovedQuotes: recentApprovedQuotes.slice(0, 5),
    };

    dashboardCache = dashboard;
    dashboardCacheTime = Date.now();

    return json(200, dashboard);
  } catch (err) {
    console.error("dashboard-stats failed:", err);
    return json(500, {
      error: "dashboard-stats failed",
      message: err?.message || String(err),
    });
  }
};
