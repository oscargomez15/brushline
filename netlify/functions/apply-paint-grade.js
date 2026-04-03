const { getStore } = require("@netlify/blobs");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const PAINT_PRODUCTS = {
  promar200: { key: "promar200", pricePerGallon: 31.95 },
  cashmere: { key: "cashmere", pricePerGallon: 38.95 },
  superpaint: { key: "superpaint", pricePerGallon: 46.95 },
  duration: { key: "duration", pricePerGallon: 57.95 },
  emerald: { key: "emerald", pricePerGallon: 65.95 },
  emerald_rain_refresh: { key: "emerald_rain_refresh", pricePerGallon: 74.45 },
};

const ALLOWED_PAINTS_BY_SHEEN = {
  satin: ["superpaint", "emerald"],
  eggshell: ["promar200", "cashmere", "emerald"],
  flat: ["promar200", "cashmere", "emerald"],
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const { id, paintGrade, t } = JSON.parse(event.body || "{}");
    if (!id || !paintGrade) {
      return json(400, { error: "Missing id or paintGrade" });
    }

    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_AUTH_TOKEN;
    if (!siteID || !token) {
      return json(500, { error: "Missing env vars" });
    }

    const store = getStore("quotes", { siteID, token });
    const quote = await store.get(id, { type: "json" });
    if (!quote) return json(404, { error: "Quote not found" });

    // public token validation if using public quote links
    if (quote.viewToken && t && quote.viewToken !== t) {
      return json(403, { error: "Invalid token" });
    }

    const wallSheen =
      quote?.estimatorData?.pricing?.wallSheen || "eggshell";

    const allowedPaints =
      ALLOWED_PAINTS_BY_SHEEN[wallSheen] || ALLOWED_PAINTS_BY_SHEEN.eggshell;

    if (!allowedPaints.includes(paintGrade)) {
      return json(400, { error: "Paint line not allowed for selected sheen" });
    }

    const totalGallons =
      Number(quote?.materials?.totalGallons) ||
      Number(quote?.totalGallons) ||
      0;

    const materialsMarkupPct =
      Number(quote?.materials?.materialsMarkupPct) ||
      Number(quote?.estimatorData?.pricing?.materialsMarkupPct) ||
      0;

    const originalPaintGrade =
      quote.originalPaintGrade ||
      quote?.materials?.originalPaintGrade ||
      quote.paintGrade ||
      "promar200";

    const originalProduct = PAINT_PRODUCTS[originalPaintGrade];
    const selectedProduct = PAINT_PRODUCTS[paintGrade];

    if (!originalProduct || !selectedProduct) {
      return json(400, { error: "Invalid paint product" });
    }

    const markupMultiplier = 1 + materialsMarkupPct / 100;

    const originalMaterialCost =
      totalGallons * originalProduct.pricePerGallon * markupMultiplier;

    const selectedMaterialCost =
      totalGallons * selectedProduct.pricePerGallon * markupMultiplier;

    const paintAdjustment = selectedMaterialCost - originalMaterialCost;

    const selectedPackageKey =
        quote.selectedPackageKey || "custom";

    const selectedPkg = (quote.scopePackages || []).find(
      (p) => p.key === selectedPackageKey
    );

    const packageBaseTotal =
    Number(selectedPkg?.total) ||
    Number(quote.packageBaseTotal) ||
    Number(quote.baseGrandTotal) ||
    0;

    const updated = {
      ...quote,
      paintGrade,
      selectedPaintGrade: paintGrade,
      originalPaintGrade,
      paintAdjustment,
      packageBaseTotal,
      grandTotal: packageBaseTotal + paintAdjustment,
      materials: {
        ...(quote.materials || {}),
        paintGrade,
        originalPaintGrade,
        totalGallons,
        paintPricePerGallon: selectedProduct.pricePerGallon,
        baseMaterialCost: totalGallons * selectedProduct.pricePerGallon,
        materialsMarkupPct,
        totalMaterialsWithMarkup: selectedMaterialCost,
        includedInPrice: true,
      },

      status: "awaiting_approval",
      approvedAt: null,
      paintChangedAt: new Date().toISOString(),
    };

    await store.setJSON(id, updated);

    try {
      const indexStore = getStore("quotes_index", { siteID, token });
      const existing = await indexStore.get(id, { type: "json" });
        await indexStore.setJSON(id, {
        ...(existing || {}),
        id,
        grandTotal: updated.grandTotal,
        status: updated.status,
        selectedPackageKey: updated.selectedPackageKey,
        selectedPaintGrade: updated.selectedPaintGrade,
        paintAdjustment: updated.paintAdjustment,
        });

    return json(200, { ok: true, quote: updated });
  } catch (err) {
    console.error("apply-paint crashed:", err);
    return json(500, {
      error: "apply-paint failed",
      message: err?.message || String(err),
    });
  }
};