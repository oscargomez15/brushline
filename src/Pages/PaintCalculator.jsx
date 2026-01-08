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
  const FURNITURE_ADDON_WALL = 0.20; // $/sqft
  const HIGH_CEILING_ADDON_WALL = 0.25; // $/sqft
  const SQFT_PER_HOUR = 124;
  const SQFT_PER_GALLON = 350;

  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const [wallPricePerSqft, setWallPricePerSqft] = useState("1.75");
  const [ceilingPricePerSqft, setCeilingPricePerSqft] = useState("1.5");
  const [doorPrice, setDoorPrice] = useState("100"); 
  const [baseboardPricePerLf, setBaseboardPricePerLf] = useState("1.25"); // example
  
  const [showSummary, setShowSummary] = useState(true);
  
  const BASEBOARD_HEIGHT_OPTIONS = [
  { label: '3.25"', value: "3.25" },
  { label: '5.25"', value: "5.25" },
  { label: '7.25"', value: "7.25" },
  { label: "Custom", value: "custom" },
  ];

  const [areas, setAreas] = useState([
    { 
      id: uid(), 
      name: "", 
      length: "", 
      width: "", 
      height: "", 
      furnitureMove: false, 
      highCeilings: false, 
      collapsed: false, 
      doorCount: "0", 
      doorWidthIn: "36", 
      doorHeightIn: "80", 
      baseboardLf: "0", 
      baseboardHeightChoice: "5.25",
      baseboardHeightCustomIn: "",
      paintWalls: true,
      paintCeiling: true,
      paintDoors: false,
      paintBaseboard: false,
  },
  ]);

  // 3) no event arg; button uses type="button"
  const addArea = () => {
    setAreas((prev) => [...prev, { id: uid(), name: "", length: "", width: "", height: "", furnitureMove: false, highCeilings: false, collapsed: false, doorCount: "0", doorWidthIn: "36", doorHeightIn: "80", baseboardLf: "0", baseboardHeightChoice: "5.25", baseboardHeightCustomIn: "" }]);
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

  const parseIntSafe = (v) => {
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const perArea = useMemo(() => {
  const baseWallRate = parseMoney(wallPricePerSqft);
  const baseCeilingRate = parseMoney(ceilingPricePerSqft);

  return areas.map((a) => {
    const wallsOn = !!a.paintWalls;
    const ceilingOn = !!a.paintCeiling;
    const doorsOn = !!a.paintDoors;
    const baseboardOn = !!a.paintBaseboard;

    const L = (wallsOn || ceilingOn || baseboardOn) ? parse(a.length) : 0;
    const W = (wallsOn || ceilingOn || baseboardOn) ? parse(a.width) : 0;
    const H = wallsOn ? parse(a.height) : 0; // ✅ height only matters for walls

    const doorCount = doorsOn ? parseIntSafe(a.doorCount) : 0;

    const wallSqftRaw = 2 * (L + W) * H;
    const ceilingSqftRaw = L * W;

    const wallSqft = wallsOn ? wallSqftRaw : 0;
    const ceilingSqft = ceilingOn ? ceilingSqftRaw : 0;

    const isHighCeiling = wallsOn ? (H > HIGH_CEILING_FT) : false;

    const ceilingRate =
      baseCeilingRate +
      (a.furnitureMove ? FURNITURE_ADDON_WALL : 0) +
      (isHighCeiling ? HIGH_CEILING_ADDON_WALL : 0);


    const wallRate = wallsOn
      ? (baseWallRate +
          (a.furnitureMove ? FURNITURE_ADDON_WALL : 0) +
          (isHighCeiling ? HIGH_CEILING_ADDON_WALL : 0))
      : 0;

    const wallCost = wallSqft * wallRate;
    const ceilingCost = ceilingSqft * ceilingRate;

    // inches → feet
    const doorWft = doorsOn ? parse(a.doorWidthIn) / 12 : 0;
    const doorHft = doorsOn ? parse(a.doorHeightIn) / 12 : 0;

    // paintable area: both sides of each door (change to 1 side if needed)
    const doorSqftPerDoor = doorWft * doorHft * 2;
    const doorSqft = doorsOn ? doorCount * doorSqftPerDoor : 0;

    // pricing
    const doorRate = parseMoney(doorPrice);
    const doorCost = doorsOn ? doorCount * doorRate : 0;

    // ===== Baseboard (auto from room perimeter) =====
    const baseboardHeightIn =
      a.baseboardHeightChoice === "custom"
        ? parse(a.baseboardHeightCustomIn)
        : parse(a.baseboardHeightChoice);

    const baseboardHeightFt = baseboardOn ? baseboardHeightIn / 12 : 0;

    // Baseboard LF from perimeter (no deductions)
    const baseboardLf = baseboardOn ? 2 * (L + W) : 0;

    // sqft for paint (front face)
    const baseboardSqft = baseboardOn ? baseboardLf * baseboardHeightFt : 0;

    // pricing
    const baseboardRate = parseMoney(baseboardPricePerLf);
    const baseboardCost = baseboardOn ? baseboardLf * baseboardRate : 0;

    // gallons
    const baseboardGallons = Math.ceil(baseboardSqft / SQFT_PER_GALLON);

    // 🎨 Paint gallons (rounded UP)
    const wallGallons = Math.ceil(wallSqft / SQFT_PER_GALLON);
    const ceilingGallons = Math.ceil(ceilingSqft / SQFT_PER_GALLON);
    const doorGallons = Math.ceil(doorSqft / SQFT_PER_GALLON);

    const wallHours = Math.ceil(wallSqft / SQFT_PER_HOUR);
    const ceilingHours = Math.ceil(ceilingSqft / SQFT_PER_HOUR);

    const totalSqft = wallSqft + ceilingSqft;

    // Costs (turn off if not included)
    const finalWallCost = wallsOn ? wallCost : 0;
    const finalCeilingCost = ceilingOn ? ceilingCost : 0;
    const finalDoorCost = doorsOn ? doorCost : 0;
    const finalBaseboardCost = baseboardOn ? baseboardCost : 0;

    // Gallons
    const finalWallGallons = wallsOn ? wallGallons : 0;
    const finalCeilingGallons = ceilingOn ? ceilingGallons : 0;
    const finalDoorGallons = doorsOn ? doorGallons : 0;
    const finalBaseboardGallons = baseboardOn ? baseboardGallons : 0;

    // Hours
    const finalWallHours = wallsOn ? wallHours : 0;
    const finalCeilingHours = ceilingOn ? ceilingHours : 0;
    // if you later add door/baseboard hours, same pattern

    const totalCost =
      finalWallCost + finalCeilingCost + finalDoorCost + finalBaseboardCost;

    const totalGallons =
      finalWallGallons + finalCeilingGallons + finalDoorGallons + finalBaseboardGallons;

    const totalHours = finalWallHours + finalCeilingHours;

    return {
      id: a.id,
      wallSqft,
      ceilingSqft,
      totalSqft,
      wallRate,
      ceilingRate,
      wallHours: finalWallHours,
      ceilingHours: finalCeilingHours,
      totalHours,
      wallGallons: finalWallGallons,
      ceilingGallons: finalCeilingGallons,
      totalGallons,
      doorCount,
      doorSqft,
      doorSqftPerDoor,
      doorGallons: finalDoorGallons,
      baseboardLf,
      baseboardSqft,
      wallCost: finalWallCost,
      doorCost: finalDoorCost,
      ceilingCost: finalCeilingCost,
      baseboardCost: finalBaseboardCost,
      baseboardGallons,
      baseboardHeightIn,
      totalCost,
      isHighCeiling,
    };
  });
}, [areas, ceilingPricePerSqft, wallPricePerSqft, doorPrice, baseboardPricePerLf]);

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
    return perArea.reduce((sum, a) => sum + (a.totalGallons || 0), 0);
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

                <label>
                  <span>Baseboard ($/LF)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="dim-input"
                    value={baseboardPricePerLf}
                    onChange={(e) => setBaseboardPricePerLf(e.target.value)}
                  />
                </label>

                <label>
                  <span>Door Price ($)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="dim-input"
                    value={doorPrice}
                    onChange={(e) => setDoorPrice(e.target.value)}
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
                    {area.paintWalls && (
                      <div className="mini-row">
                        <span className="mini-label">Walls </span>
                        <span className="mini-value">{fmtMoney(calc.wallCost)}</span>
                      </div>
                    )}

                    {area.paintCeiling && (
                      <div className="mini-row">
                        <span className="mini-label">Ceilings </span>
                        <span className="mini-value">{fmtMoney(calc.ceilingCost)}</span>
                      </div>
                    )}

                    {area.paintDoors && (
                      <div className="mini-row">
                        <span className="mini-label">Doors </span>
                        <span className="mini-value">{fmtMoney(calc.doorCost)}</span>
                      </div>
                    )}
                    <div className="mini-row">
                      <span className="mini-label">Area Total </span>
                      <span className="mini-value">{fmtMoney(calc.totalCost)}</span>
                    </div>
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
              <div className="surfaces-container">
                {!area.paintWalls && !area.paintCeiling && !area.paintDoors && !area.paintBaseboard && (
                  <div className="scope-warning">
                    Select at least one surface (Walls, Ceiling, Doors, or Baseboard).
                  </div>
                )}
                <h3>Scope</h3>
                <div className="options">
                  <label className='scope-option'>
                    <input
                      type="checkbox"
                      checked={!!area.paintWalls}
                      onChange={(e) => updateArea(area.id, "paintWalls", e.target.checked)}
                    />
                    <span>Walls</span>
                  </label>

                  <label className='scope-option'>
                    <input
                      type="checkbox"
                      checked={!!area.paintCeiling}
                      onChange={(e) => updateArea(area.id, "paintCeiling", e.target.checked)}
                    />
                    <span>Ceiling</span>
                  </label>

                  <label className='scope-option'>
                    <input
                      type="checkbox"
                      checked={!!area.paintDoors}
                      onChange={(e) => updateArea(area.id, "paintDoors", e.target.checked)}
                    />
                    <span>Doors</span>
                  </label>

                  <label className='scope-option'>
                    <input
                      type="checkbox"
                      checked={!!area.paintBaseboard}
                      onChange={(e) => updateArea(area.id, "paintBaseboard", e.target.checked)}
                    />
                    <span>Baseboard</span>
                  </label>
                </div>
              </div>
              {area.paintWalls || area.paintBaseboard && (
              <div className="conditions-container">
                <h3>Conditions</h3>
                <div>
                  <input
                    type="checkbox"
                    checked={!!area.furnitureMove}
                    onChange={(e) => updateArea(area.id, "furnitureMove", e.target.checked)}
                  />
                  Furniture needs to be moved/covered
                </div>

                <div>
                  <input type="checkbox" checked={!!calc.isHighCeiling} disabled />
                  High ceilings (over 10 ft)
                </div>
              </div>
              )}

              <div className="area-calc-body">
                <div className="dimensions-container">
                  <h3>Measurements (ft)</h3>
                  {(area.paintWalls || area.paintCeiling || area.paintBaseboard) && (
                    <>
                      <DimInput label="Length" value={area.length} onChange={(v) => updateArea(area.id, "length", v)} />
                      <DimInput label="Width"  value={area.width}  onChange={(v) => updateArea(area.id, "width", v)} />
                    </>
                  )}

                  {(area.paintWalls) && (
                  <DimInput label="Height" value={area.height} onChange={(v) => updateArea(area.id, "height", v)} />
                  )}


                {area.paintBaseboard && (
                <div className="baseboard-container">
                  <h3>Baseboard</h3>

                  <label className="flex flex-col gap-1">
                    <span>Baseboard Height</span>
                    <select
                      value={area.baseboardHeightChoice}
                      onChange={(e) => updateArea(area.id, "baseboardHeightChoice", e.target.value)}
                      className="dim-input"
                    >
                      {BASEBOARD_HEIGHT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {area.baseboardHeightChoice === "custom" && (
                    <DimInput
                      label='Custom Height (in)'
                      value={area.baseboardHeightCustomIn}
                      onChange={(v) => updateArea(area.id, "baseboardHeightCustomIn", v)}
                    />
                  )}
                </div>
                )}
                
                  {area.paintDoors && (
                  <div className="doors-container">
                    <h3>Doors Info</h3>
                    <label className="flex flex-col gap-1">
                      <span>Door Count</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="dim-input"
                        value={area.doorCount}
                        onChange={(e) => updateArea(area.id, "doorCount", e.target.value)}
                      />
                    </label>

                    <div className="doors-dims">
                      <DimInput label="Door Width (in)" value={area.doorWidthIn} onChange={(v) => updateArea(area.id, "doorWidthIn", v)} />
                      <DimInput label="Door Height (in)" value={area.doorHeightIn} onChange={(v) => updateArea(area.id, "doorHeightIn", v)} />
                    </div>
                  </div>
                )}                 
                
                </div>

                


                <div className="calculations-container">
                  <h3>Calculations (sq ft)</h3>
                  {area.paintWalls && (
                  <div className="calculations-card">
                    <h3>Wall</h3>
                    <div className="calculations-items">
                      <Stat label="Sq. Ft." value={fmt(calc.wallSqft)} />
                      <Stat label="Rate" value={fmtDollar(calc.wallRate)} />
                      <Stat label="Price" value={fmtMoney(calc.wallCost)} />
                      <Stat label="Time" value={fmtHours(calc.wallHours)} />
                    </div>
                  </div>
                  )}

                  {area.paintCeiling && (
                  <div className="calculations-card">
                    <h3>Ceiling</h3>
                    <div className="calculations-items">
                      <Stat label="Sq. Ft." value={fmt(calc.ceilingSqft)} />
                      <Stat label="Rate" value={fmtDollar(calc.ceilingRate)} />
                      <Stat label="Price" value={fmtMoney(calc.ceilingCost)} />
                      <Stat label="Time" value={fmtHours(calc.ceilingHours)} />
                    </div>
                  </div>
                  )}

                  <div className="calculations-card">
                  <h3>Paint</h3>
                    <div className="calculations-items">
                      {area.paintWalls && <Stat label="Wall Gallons" value={calc.wallGallons} />}
                      {area.paintCeiling && <Stat label="Ceiling Gallons" value={calc.ceilingGallons} />}
                      {area.paintDoors && <Stat label="Door Gallons" value={calc.doorGallons} />}
                      {area.paintBaseboard && <Stat label="Baseboard Gallons" value={calc.baseboardGallons} />}
                    </div>
                  </div>
                  {area.paintBaseboard && (
                  <div className="calculations-card">
                    <h3>Baseboard</h3>
                    <div className="calculations-items">
                      <Stat label="LF" value={fmt(calc.baseboardLf)} />
                      <Stat label="Sq. Ft." value={fmt(calc.baseboardSqft)} />
                      <Stat label="Price" value={fmtMoney(calc.baseboardCost)} />
                      <Stat label="Gallons" value={calc.baseboardGallons} />
                    </div>
                  </div>
                )}

                  {area.paintDoors && (
                  <div className="calculations-card">
                  <h3>Doors</h3>
                    <div className="calculations-items">
                      <Stat label="Sq. Ft." value={fmt(calc.doorSqft)} />
                      <Stat label="Count" value={calc.doorCount} />
                      <Stat label="Price" value={fmtMoney(calc.doorCost)} />
                      <Stat label="Gallons" value={calc.doorGallons} />
                    </div>
                  </div>
                  )}

                  <Stat label="Area Total" value={fmtMoney(calc.totalCost)} />
                  <Stat label="Total Gallons" value={calc.totalGallons} />
                </div>
              </div>
                  </>
              )}
            </div>
          );
        })}
      </form>

      {/* 3) non-submit add button */}
      <button type="button" onClick={addArea} className='add-area-btn add'>
        + Add Area
      </button>

      <div className={`summary-sticky ${showSummary ? "" : "is-hidden"}`}>
        <div className="grand-total">
          <div className="summary-header">
            <h2>Summary</h2>

            <button
              type="button"
              className="collapse-area-btn"
              onClick={() => setShowSummary((s) => !s)}
              title={showSummary ? "Hide summary" : "Show summary"}
            >
              {showSummary ? "Hide" : "Show"}
            </button>
          </div>

          {showSummary && (
            <div className="total-items">
              <h2>Job Total: {fmtMoney(grandTotal)}</h2>
              <h2>Estimated Completion Time: {fmtHours(totalJobHours)}</h2>
              <h2>Paint Needed: {totalJobGallons} gallons</h2>
            </div>
          )}
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
