const { getStore } = require("@netlify/blobs");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function packageScope(key) {
  if (key === "walls_only") return new Set(["Walls"]);
  if (key === "walls_ceilings") return new Set(["Walls", "Ceilings"]);
  return new Set(["Walls", "Ceilings", "Baseboards", "Doors"]);
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    const { id, packageKey } = JSON.parse(event.body || "{}");
    if (!id || !packageKey) return json(400, { error: "Missing id or packageKey" });

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) return json(500, { error: "Missing env vars" });

    const store = getStore("quotes", { siteID, token });
    const quote = await store.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    const pkg = (quote.scopePackages || []).find((p) => p.key === packageKey);
    if (!pkg) return json(400, { error: "Invalid packageKey" });

    const allowed = packageScope(packageKey);

    // Update scopeItems to match selected package (for display)
    const updatedScopeItems = (quote.scopeItems || []).map((a) => ({
      ...a,
      scope: (a.scope || []).filter((s) => allowed.has(s)).concat(
        [...allowed].filter((s) => !(a.scope || []).includes(s))
      ),
    }));

    const packageTotal = Number(pkg.total) || 0;
    const paintAdjustment = Number(quote.paintAdjustment) || 0;

    const updated = {
      ...quote,
      selectedPackageKey: packageKey,
      grandTotal: packageTotal + paintAdjustment,
      packageBaseTotal: packageTotal,
      scopeItems: updatedScopeItems,

      // require re-approval after scope change
      status: "awaiting_approval",
      approvedAt: null,
      packageChangedAt: new Date().toISOString(),
    };

    await store.setJSON(id, updated);

    // If you have quotes_index, update it too (safe try)
    try {
      const indexStore = getStore("quotes_index", { siteID, token });
      const existing = await indexStore.get(id, { type: "json" });
      await indexStore.setJSON(id, {
        ...(existing || {}),
        id,
        grandTotal: updated.grandTotal,
        status: updated.status,
        selectedPackageKey: updated.selectedPackageKey,
      });
    } catch {}

    return json(200, { ok: true, quote: updated });
  } catch (err) {
    console.error("apply-package crashed:", err);
    return json(500, { error: "apply-package failed", message: err?.message || String(err) });
  }
};