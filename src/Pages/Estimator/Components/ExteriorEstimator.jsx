import React, { useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { useNavigate } from "react-router-dom";
import ExteriorSummarySticky from "./ExteriorSummarySticky";

// Coverage (sq ft per gallon) – adjust if you want exterior to differ
const SQFT_PER_GALLON_EXTERIOR = 350;

const defaultSides = [
  { id: "front", label: "Front", length: "" },
  { id: "right", label: "Right", length: "" },
  { id: "back", label: "Back", length: "" },
  { id: "left", label: "Left", length: "" },
];

const toNum = (v) => {
  if (v == null) return 0;
  const normalized = String(v).trim().replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

export default function ExteriorEstimator({ customer }) {
  const navigate = useNavigate();
  const [showSummary, setShowSummary] = useState(false);

  // price control (top card)
  const [pricePerSqft, setPricePerSqft] = useState("2.50");

  // measurements
  const [soffitHeight, setSoffitHeight] = useState("10");
  const [sides, setSides] = useState(defaultSides);

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
        extras: [],
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
      grandTotal: totals.totalCost,
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
        soffitHeight: heightFt,
        pricePerSqft: rate,
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

              <div className="exterior-meta">
                <div className="mini-row">
                  <span className="mini-label">Coverage</span>
                  <span className="mini-value">{SQFT_PER_GALLON_EXTERIOR} sq ft/gal</span>
                </div>
              </div>
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
                  <span className="mini-value">{fmtMoney(totals.totalCost)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="area-calc-body exterior-grid">
            <div className="dimensions-container">
              <h3>Measurements (ft)</h3>

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

            <div className="calculations-container">
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
                  <Stat label="Estimated Total" value={fmtMoney(totals.totalCost)} />
                </div>
              </div>

              <div className="scope-warning" style={{ marginTop: 12 }}>
                This is a quick estimate. It doesn’t subtract windows/doors or add gables yet.
              </div>
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
        grandTotal={totals.totalCost}
        fmtMoney={fmtMoney}
        fmt={fmt}
      />
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="calculation-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}