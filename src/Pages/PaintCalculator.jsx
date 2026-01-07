import React from 'react'
import { useState, useMemo } from 'react';
import '../Styling/PaintCalculator.css'

// ...imports

export const PaintCalculator = () => {
  const AREA_OPTIONS = [
    "Hallway","Living Room","Kitchen","Guest Room","Primary Bedroom",
    "Bathroom","Dining Room","Office","Garage","Exterior",
  ];
  const HIGH_CEILING_FT = 10;
  const FURNITURE_ADDON_WALL = 0.15; // $/sqft
  const HIGH_CEILING_ADDON_WALL = 0.25; // $/sqft
  const SQFT_PER_HOUR = 124;
  const SQFT_PER_GALLON = 350;

  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const [wallPricePerSqft, setWallPricePerSqft] = useState("2");
  const [ceilingPricePerSqft, setCeilingPricePerSqft] = useState("1.5");

  const [areas, setAreas] = useState([
    { id: uid(), name: "", length: "", width: "", height: "", furnitureMove: false, highCeilings: false, collapsed: false },
  ]);

  // 3) no event arg; button uses type="button"
  const addArea = () => {
    setAreas((prev) => [...prev, { id: uid(), name: "", length: "", width: "", height: "", furnitureMove: false, highCeilings: false, collapsed: false }]);
  };

  const removeArea = (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  const updateArea = (id, key, value) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
  };

  const toggleArea = (id) => {
  setAreas((prev) =>
    prev.map((a) => (a.id === id ? { ...a, collapsed: !a.collapsed } : a))
  );
};

  // 4) parse allows commas, keep inputs raw strings
  const parse = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const parseMoney = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

  const perArea = useMemo(() => {
  const baseWallRate = parseMoney(wallPricePerSqft);
  const ceilingRate = parseMoney(ceilingPricePerSqft);

  return areas.map((a) => {
    const L = parse(a.length);
    const W = parse(a.width);
    const H = parse(a.height);

    const wallSqft = 2 * (L + W) * H;
    const ceilingSqft = L * W;

    const isHighCeiling = H > HIGH_CEILING_FT;

    const wallRate =
      baseWallRate +
      (a.furnitureMove ? FURNITURE_ADDON_WALL : 0) +
      (isHighCeiling ? HIGH_CEILING_ADDON_WALL : 0);

    const wallCost = wallSqft * wallRate;
    const ceilingCost = ceilingSqft * ceilingRate;

    // 🎨 Paint gallons (rounded UP)
    const wallGallons = Math.ceil(wallSqft / SQFT_PER_GALLON);
    const ceilingGallons = Math.ceil(ceilingSqft / SQFT_PER_GALLON);
    const totalGallons = wallGallons + ceilingGallons;

    const wallHours = Math.ceil(wallSqft / SQFT_PER_HOUR);
    const ceilingHours = Math.ceil(ceilingSqft / SQFT_PER_HOUR);
    const totalHours = wallHours + ceilingHours;

    const totalSqft = wallSqft + ceilingSqft;
    const totalCost = wallCost + ceilingCost;

    return {
      id: a.id,
      wallSqft,
      ceilingSqft,
      totalSqft,
      wallRate,
      ceilingRate,
      wallCost,
      ceilingCost,
      wallHours,
      ceilingHours,
      totalHours,
      wallGallons,
      ceilingGallons,
      totalGallons,
      totalCost,
      isHighCeiling,
    };
  });
}, [areas, ceilingPricePerSqft, wallPricePerSqft]);

  const grandTotal = useMemo(() => {
    return perArea.reduce((sum, a) => sum + a.totalCost, 0);
  }, [perArea]);

const totalJobHours = useMemo(() => {
  const rawTotal = perArea.reduce(
    (sum, a) => sum + (a.wallSqft + a.ceilingSqft) / SQFT_PER_HOUR,
    0
  );
  return Math.ceil(rawTotal);
}, [perArea]);

const totalJobGallons = useMemo(() => {
  const rawSqft = perArea.reduce(
    (sum, a) => sum + a.wallSqft + a.ceilingSqft,
    0
  );
  return Math.ceil(rawSqft / SQFT_PER_GALLON);
}, [perArea]);

  const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0);

  const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

  const fmtDollar = (n) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);

  const fmtHours = (n) => `${n || 0} hrs`;
  // 1) prevent default submit on Enter
  return (
    <section className='paint-calculator-wrapper'>
      <div className="content-wrapper">
      <div className='sub-heading'>
        <h1>Paint Calculator</h1>
        <p>This tool is to be used exclusively by Authorized Employees.</p>
            <div className="price-inputs">
              <h2>Price per Square Feet</h2>
              <p>Price set is standard rate. Price will change based on some of the conditions.</p>
              <div className="price-input-items">
                <label>
                  <span>Wall ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="dim-input"
                    value={wallPricePerSqft}
                    onChange={(e) => setWallPricePerSqft(e.target.value)}
                  />
                </label>
                <label>
                  <span>Ceiling ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="dim-input"
                    value={ceilingPricePerSqft}
                    onChange={(e) => setCeilingPricePerSqft(e.target.value)}
                  />
                </label>
              </div>
            </div>
      </div>


      <form className='paint-calculator-form' onSubmit={(e) => e.preventDefault()}>
        {areas.map((area) => {
          const calc = perArea.find((x) => x.id === area.id) || {
            wallSqft: 0,
            ceilingSqft: 0,
            wallRate: 0,
            ceilingRate: 0,
            wallCost: 0,
            ceilingCost: 0,
            wallHours: 0,
            ceilingHours: 0,
            totalHours: 0,
            wallGallons: 0,
            ceilingGallons: 0,
            totalGallons: 0,
            totalCost: 0,
          };
          return (
            <div key={area.id} className={`area-card ${area.collapsed ? "is-collapsed" : ""}`}>
              <div className="area-card-header">
                <div className="area-card-title">
                  <div className="area-name">
                    {area.name ? area.name : "Unnamed Area"}
                  </div>
                  <div className="area-sub">
                    Area Total: <span className="area-total">{fmtMoney(calc.totalCost)}</span>
                  </div>
                </div>
                <div className="area-card-actions">
                  <button
                    type="button"
                    className="collapse-area-btn"
                    onClick={() => toggleArea(area.id)}
                    title={area.collapsed ? "Expand area" : "Collapse area"}
                  >
                    {area.collapsed ? "Expand" : "Minimize"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeArea(area.id)}
                    className="remove-area-btn delete"
                    title="Remove area"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {area.collapsed ? null : (
                <>
              <div className="area-selection-container">
                <select
                  value={area.name}
                  onChange={(e) => updateArea(area.id, "name", e.target.value)}
                >
                  <option value=""> Choose an area</option>
                  {AREA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="conditions-container">
                <h3>Conditions</h3>
                <div>
                  <input
                    type="checkbox"
                    checked={!!area.furnitureMove}
                    onChange={(e) => updateArea(area.id, "furnitureMove", e.target.checked)}
                  />
                  Furniture needs to be moved
                </div>

                <div>
                  <input type="checkbox" checked={!!calc.isHighCeiling} disabled />
                  High ceilings (over 10 ft)
                </div>
              </div>
              <div className="area-calc-body">
                <div className="dimensions-container">
                  <h3>Measurements (ft)</h3>
                  <DimInput label="Length" value={area.length} onChange={(v) => updateArea(area.id, "length", v)} />
                  <DimInput label="Width"  value={area.width}  onChange={(v) => updateArea(area.id, "width", v)} />
                  <DimInput label="Height" value={area.height} onChange={(v) => updateArea(area.id, "height", v)} />
                </div>

                <div className="calculations-container">
                  <h3>Calculations (sq ft)</h3>
                  <div className="calculations-card">
                    <h3>Wall</h3>
                    <div className="calculations-items">
                      <Stat label="Sq. Ft." value={fmt(calc.wallSqft)} />
                      <Stat label="Rate" value={fmtDollar(calc.wallRate)} />
                      <Stat label="Price" value={fmtMoney(calc.wallCost)} />
                      <Stat label="Time" value={fmtHours(calc.wallHours)} />
                    </div>
                  </div>
                  
                  <div className="calculations-card">
                    <h3>Ceiling</h3>
                    <div className="calculations-items">
                      <Stat label="Sq. Ft." value={fmt(calc.ceilingSqft)} />
                      <Stat label="Rate" value={fmtDollar(calc.ceilingRate)} />
                      <Stat label="Price" value={fmtMoney(calc.ceilingCost)} />
                      <Stat label="Time" value={fmtHours(calc.ceilingHours)} />
                    </div>
                  </div>

                  <div className="calculations-card">
                  <h3>Paint</h3>
                    <div className="calculations-items">
                      <Stat label="Wall Gallons" value={calc.wallGallons} />
                      <Stat label="Ceiling Gallons" value={calc.ceilingGallons} />
                    </div>
                  </div>
                  <Stat label="Area Total" value={fmtMoney(calc.totalCost)} />
                  <Stat label="Total Gallons" value={calc.totalGallons} />
                </div>
              </div>
                  </>
              )}

              {/* 2) make it a non-submit button */}
              <button
                type="button"
                onClick={() => removeArea(area.id)}
                className="remove-area-btn delete"
                title="Remove area"
              >
                - Remove Area
              </button>
            </div>
          );
        })}
      </form>

      {/* 3) non-submit add button */}
      <button type="button" onClick={addArea} className='add-area-btn add'>
        + Add Area
      </button>

        <div className="grand-total">
          <h2>Summary</h2>
          <div className="total-items">
            <h2>Job Total: {fmtMoney(grandTotal)}</h2>
            <h2>Estimated Completion Time: {fmtHours(totalJobHours)} </h2>
            <h2>Paint Needed: {totalJobGallons} gallons</h2>
          </div>
        </div>
      </div>

    </section>
  );
}

// DimInput without aggressive cleaning
function DimInput({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        className="dim-input"
        placeholder="e.g., 12.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="">
      <div className="calculation-label">{label}</div>
      <div className="">{value}</div>
    </div>
  );
}
