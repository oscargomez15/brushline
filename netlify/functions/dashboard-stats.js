const { getStore } = require("@netlify/blobs");

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

    const indexStore = getStore("quotes_index", { siteID, token });
    const { blobs } = await indexStore.list();

    const now = new Date();
    const currentYear = now.getFullYear();

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyApprovedCount = new Array(12).fill(0);

    let approvedRevenueYTD = 0;
    let approvedQuotesYTD = 0;

    for (const blob of blobs) {
      const item = await indexStore.get(blob.key, { type: "json" });
      if (!item) continue;

      if (item.status !== "approved") continue;
      if (!item.approvedAt) continue;

      const approvedDate = new Date(item.approvedAt);
      if (Number.isNaN(approvedDate.getTime())) continue;
      if (approvedDate.getFullYear() !== currentYear) continue;

      const month = approvedDate.getMonth();
      const amount = Number(item.grandTotal) || 0;

      monthlyRevenue[month] += amount;
      monthlyApprovedCount[month] += 1;

      approvedRevenueYTD += amount;
      approvedQuotesYTD += 1;
    }

    const revenueByMonth = monthLabels.map((label, i) => ({
      label,
      revenue: Math.round(monthlyRevenue[i] * 100) / 100,
      count: monthlyApprovedCount[i],
    }));

    const avgApprovedQuote =
      approvedQuotesYTD > 0
        ? Math.round((approvedRevenueYTD / approvedQuotesYTD) * 100) / 100
        : 0;

    return json(200, {
      year: currentYear,
      approvedRevenueYTD: Math.round(approvedRevenueYTD * 100) / 100,
      approvedQuotesYTD,
      avgApprovedQuote,
      revenueByMonth,
    });
  } catch (err) {
    console.error("dashboard-stats failed:", err);
    return json(500, {
      error: "dashboard-stats failed",
      message: err?.message || String(err),
    });
  }
};