import React, { useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { useNavigate } from "react-router-dom";
import ExteriorSummarySticky from "./ExteriorSummarySticky";
import "../../../Styling/ExteriorEstimator.css";

// Coverage (sq ft per gallon) – adjust if you want exterior to differ
const SQFT_PER_GALLON_EXTERIOR = 350;

const defaultSides = [
  { id: "front", label: "Front", length: "" },
  { id: "right", label: "Right", length: "" },
  { id: "back", label: "Back", length: "" },
  { id: "left", label: "Left", length: "" },
];

const LOXON_PRIMER_PRICE = 24.95;

const EXTERIOR_PAINT_OPTIONS = [
  {
    key: "superpaint",
    label: "Super Paint",
    pricePerGallon: 45.99,
    image: "/images/superpaint-ext.jpg",
  },
  {
    key: "duration",
    label: "Duration",
    pricePerGallon: 51.95,
    image: "/images/duration-ext.jpg",
  },
  {
    key: "emerald",
    label: "Emerald",
    pricePerGallon: 66.95,
    image: "/images/emerald-ext.jpg",
  },
  {
    key: "emerald_rain_refresh",
    label: "Emerald Rain Refresh",
    pricePerGallon: 75.45,
    image: "/images/emerald-rain-ext.jpg",
  },
];

const toNum = (v) => {
  if (v == null) return 0;
  const normalized = String(v).trim().replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

export default function ExteriorEstimator({ customer, existingQuote=null, mode='create' }) {
  
  const navigate = useNavigate();
  const exteriorData = existingQuote?.exterior || {};
  const [showSummary, setShowSummary] = useState(false);
  const [addOns, setAddons] = useState(() => {
  const extras = existingQuote?.scopeItems?.[0]?.extras || [];

  return extras.map((item) => ({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: item.label || "",
    price: item.price?.toString() || "",
    included: true,
  }));
});
  // price control (top card)
  const [pricePerSqft, setPricePerSqft] = useState(
    exteriorData.pricePerSqft?.toString() || "2.50"
  );

  const [paintType, setPaintType] = useState(
  exteriorData.paintType || "superpaint"
);

  // measurements
  const [soffitHeight, setSoffitHeight] = useState(
  exteriorData.soffitHeight?.toString() || "10"
  );
  const [sides, setSides] = useState(() => {
    if (Array.isArray(exteriorData.sides) && exteriorData.sides.length > 0) {
      return exteriorData.sides.map((side) => ({
        id: side.id,
        label: side.label,
        length: side.length?.toString() || "",
      }));
    }

    return defaultSides;
  });

  const updateSide = (id, value) => {
    setSides((prev) => prev.map((s) => (s.id === id ? { ...s, length: value } : s)));
  };

  const heightFt = toNum(soffitHeight);
  const rate = toNum(pricePerSqft);

  const perSide = useMemo(() => {
    return sides.map((s) => {
      const lengthFt = toNum(s.length);
      const sqft = Math.max(0, lengthFt * Math.max(0, heightFt));
      const gallons = sqft > 0 ? Math.ceil(sqft / SQFT_PER_GALLON_EXTERIOR) : 0;
      const cost = sqft * rate;

      return {
        ...s,
        lengthFt,
        sqft,
        gallons,
        cost,
      };
    });
  }, [sides, heightFt, rate]);

  const selectedPaint = EXTERIOR_PAINT_OPTIONS.find(
  (paint) => paint.key === paintType
);

  const totals = useMemo(() => {
    const totalSqft = perSide.reduce((sum, s) => sum + (s.sqft || 0), 0);
    const totalGallons = totalSqft > 0 ? Math.ceil(totalSqft / SQFT_PER_GALLON_EXTERIOR) : 0;
    const totalCost = totalSqft * rate;

    return { totalSqft, totalGallons, totalCost };
  }, [perSide, rate]);

  const fmt = (n) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0);

  const fmtMoney = (n) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);
  
  const addAddOn = () => {
    setAddons((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        label: "",
        price: "",
        included: false,
      },
    ]);
  };

  const updateAddOn = (id, field, value) => {
    setAddons((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeAddOn = (id) => {
    setAddons((prev) => prev.filter((item) => item.id !== id));
  };

  const canCreate = useMemo(() => {
    const hasCustomer =
      customer?.firstName?.trim() &&
      customer?.lastName?.trim() &&
      customer?.address?.trim();

    const hasMeasurements = sides.some((s) => toNum(s.length) > 0);

    return !!hasCustomer && hasMeasurements && totals.totalCost > 0;
  }, [customer, sides, totals.totalCost]);

  const buildScopeItems = () => {
    return [
      {
        areaId: "exterior",
        areaName: "Exterior",
        scope: ["Exterior Walls"],
        extras: includedAddOns.map((item) => ({
          label: item.label.trim(),
          price: toNum(item.price),
        })),
      },
    ];
  };

  const handleGenerateQuote = async () => {
    if (!canCreate) return;

    const user = netlifyIdentity.currentUser();
    const token = user ? await user.jwt() : null;

    if (!token) {
      alert("You must be logged in to generate a quote.");
      return;
    }

    const payload = {
      jobType: "exterior",
      grandTotal: grandTotal,
      totalGallons: totals.totalGallons,

      companyName: "Brushline Services",
      validForDays: 30,

      customerId: customer?.customerId || null,
      customer: {
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        address: customer?.address || "",
        unit: customer?.unit || "",
        email: customer?.email || "",
        phone: customer?.phone || "",
      },

      note: "Thanks for having us out — excited about this project!",
      scopeItems: buildScopeItems(),

    exterior: {
      primerType: "Sherwin Williams Loxon Primer",
      primerGallons,

      soffitHeight: heightFt,
      pricePerSqft: rate,

      paintType,
      paintLabel: selectedPaint?.label || "",

      paintPricePerGallon:
        selectedPaint?.pricePerGallon || 0,

      paintGallons:
        totals.totalGallons,

      paintMaterialCost:
        paintCost,

      totalSqft: totals.totalSqft,
      totalGallons: totals.totalGallons,

      sides: perSide.map((s) => ({
        id: s.id,
        label: s.label,
        length: s.lengthFt,
        sqft: s.sqft,
        gallons: s.gallons,
        cost: s.cost,
      })),
    },
    };

    const res = await fetch("/.netlify/functions/create-quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Failed to create quote");
      return;
    }

    navigate(data.url);
  };

  const includedAddOns = useMemo(() => {
  return addOns
    .map((item) => ({
      ...item,
      priceNum: toNum(item.price),
    }))
    .filter((item) => item.included && item.label.trim() && item.priceNum > 0);
}, [addOns]);

  const addOnsTotal = useMemo(() => {
    return includedAddOns.reduce((sum, item) => sum + item.priceNum, 0);
  }, [includedAddOns]);

const finishPaintCost = useMemo(() => {
  const gallonPrice = selectedPaint?.pricePerGallon || 0;

  return totals.totalGallons * gallonPrice;
}, [selectedPaint, totals.totalGallons]);

const primerGallons = totals.totalGallons;

const primerCost = useMemo(() => {
  return primerGallons * LOXON_PRIMER_PRICE;
}, [primerGallons]);

const paintCost = useMemo(() => {
  return finishPaintCost + primerCost;
}, [finishPaintCost, primerCost]);

const grandTotal = useMemo(() => {
  return totals.totalCost + addOnsTotal + paintCost ;
}, [totals.totalCost, addOnsTotal, paintCost]);



  return (
    <section className="exterior-calculator-wrapper">
      <div className="content-wrapper">
        <div className="sub-heading">
          <h1>Exterior Estimator</h1>
          <p>Enter each side length and soffit height. We’ll estimate sqft + paint gallons.</p>

          <div className="price-inputs">
            <h2>Price</h2>
            <p>Adjust the price per sq ft for exterior.</p>

            <div className="price-input-items">
              <label>
                <span>Exterior ($/sq ft)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dim-input"
                  value={pricePerSqft}
                  onChange={(e) => setPricePerSqft(e.target.value)}
                />
              </label>

              <label>
                <span>Height to Soffit (ft)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dim-input"
                  value={soffitHeight}
                  onChange={(e) => setSoffitHeight(e.target.value)}
                />
              </label>

              <label>
                <span>Paint Type</span>
                <select
                  className="dim-input"
                  value={paintType}
                  onChange={(e) => setPaintType(e.target.value)}
                >
                  {EXTERIOR_PAINT_OPTIONS.map((paint) => (
                    <option key={paint.key} value={paint.key}>
                      {paint.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="area-card">
          <div className="area-card-header">
            <div className="area-card-title">
              <div className="area-name">House Sides</div>
              <div className="area-sub">
                <div className="mini-row">
                  <span className="mini-label">Total Sq Ft </span>
                  <span className="mini-value">{fmt(totals.totalSqft)}</span>
                </div>
                <div className="mini-row">
                  <span className="mini-label">Total Gallons </span>
                  <span className="mini-value">{totals.totalGallons}</span>
                </div>
                <div className="mini-row">
                  <span className="mini-label">Estimated Total </span>
                  <span className="mini-value">{fmtMoney(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="area-calc-body exterior-grid">
            <div className="dimensions-container">
              <h3>Measurements (ft)</h3>

              <div className="measurements-container">
              {sides.map((s) => (
                <label key={s.id} className="flex flex-col gap-1">
                  <span>{s.label} Length</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="dim-input"
                    placeholder="e.g., 45"
                    value={s.length}
                    onChange={(e) => updateSide(s.id, e.target.value)}
                  />
                </label>
              ))}
              </div>
            </div>

            {/* <div className="calculations-container">
              <h3>Calculations (sq ft)</h3>

              {perSide.map((s) => (
                <div key={s.id} className="calculations-card">
                  <h3>{s.label}</h3>
                  <div className="calculations-items">
                    <Stat label="Sq. Ft." value={fmt(s.sqft)} />
                    <Stat label="Gallons" value={s.gallons} />
                  </div>
                </div>
              ))}

              <div className="calculations-card">
                <h3>Total</h3>
                <div className="calculations-items">
                  <Stat label="Total Sq. Ft." value={fmt(totals.totalSqft)} />
                  <Stat label="Total Gallons" value={totals.totalGallons} />
                  <Stat label="Rate" value={fmtMoney(rate)} />
                  <Stat label="Base Total" value={fmtMoney(totals.totalCost)} />
                  <Stat label="Add-Ons" value={fmtMoney(addOnsTotal)} />
                  <Stat label="Estimated Total" value={fmtMoney(grandTotal)} />
                </div>
              </div>

              <div className="scope-warning" style={{ marginTop: 12 }}>
                This is a quick estimate. It doesn’t subtract windows/doors or add gables yet.
              </div>
            </div> */}
          </div>
          <div className="area-card">
            
          <div className="addons-box">
            <div className="addons-header">
              <h3>Additional Work / Add-Ons</h3>

              <div className="addons-summary">
                <span>Included: {includedAddOns.length}</span>
                <span>Total: {fmtMoney(addOnsTotal)}</span>
              </div>
            </div>

            <div className="addons-list">
              {addOns.map((item) => (
                <div key={item.id} className="addon-row">
                  <input
                    type="text"
                    className="dim-input"
                    placeholder="Pressure washing driveway"
                    value={item.label}
                    onChange={(e) => updateAddOn(item.id, "label", e.target.value)}
                  />

                  <input
                    type="text"
                    className="dim-input"
                    placeholder="$250"
                    value={item.price}
                    onChange={(e) => updateAddOn(item.id, "price", e.target.value)}
                  />

                  <label className="addon-toggle">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={(e) =>
                        updateAddOn(item.id, "included", e.target.checked)
                      }
                    />
                    <span>Include</span>
                  </label>

                  <button
                    type="button"
                    className="addon-remove"
                    onClick={() => removeAddOn(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="addon-add" onClick={addAddOn}>
              + Add Custom Add-On
            </button>
          </div>
          </div>
        </div>

        <button
          type="button"
          className="generate-btn add"
          onClick={handleGenerateQuote}
          disabled={!canCreate}
          style={{ opacity: canCreate ? 1 : 0.6 }}
        >
          Generate Client Quote
        </button>
      </div>

    <ExteriorSummarySticky
      showSummary={showSummary}
      setShowSummary={setShowSummary}
      totalSqft={totals.totalSqft}
      totalGallons={totals.totalGallons}
      ratePerSqft={rate}
      paintType={selectedPaint?.label}
      paintCost={paintCost}
      finishPaintCost={finishPaintCost}
      primerGallons={primerGallons}
      primerPricePerGallon={LOXON_PRIMER_PRICE}
      primerCost={primerCost}
      addOnsTotal={addOnsTotal}
      grandTotal={grandTotal}
      fmtMoney={fmtMoney}
      fmt={fmt}
    />
    </section>
  );
}

// function Stat({ label, value }) {
//   return (
//     <div>
//       <div className="calculation-label">{label}</div>
//       <div>{value}</div>
//     </div>
//   );
// }