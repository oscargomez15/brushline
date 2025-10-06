import React from 'react'
import { useState, useMemo } from 'react';
import '../Styling/PaintCalculator.css'

// ...imports

export const PaintCalculator = () => {
  const AREA_OPTIONS = [
    "Hallway","Living Room","Kitchen","Guest Room","Primary Bedroom",
    "Bathroom","Dining Room","Office","Garage","Exterior",
  ];

  const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const [areas, setAreas] = useState([
    { id: uid(), name: "", length: "", width: "", height: "" },
  ]);

  // 3) no event arg; button uses type="button"
  const addArea = () => {
    setAreas((prev) => [...prev, { id: uid(), name: "", length: "", width: "", height: "" }]);
  };

  const removeArea = (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  const updateArea = (id, key, value) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
  };

  // 4) parse allows commas, keep inputs raw strings
  const parse = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const perArea = useMemo(() => {
    return areas.map((a) => {
      const L = parse(a.length);
      const W = parse(a.width);
      const H = parse(a.height);
      const wallSqft = 2 * (L + W) * H;
      const ceilingSqft = L * W;
      const total = wallSqft + ceilingSqft;
      return { id: a.id, wallSqft, ceilingSqft, total };
    });
  }, [areas]);

  const totals = useMemo(() => {
    return perArea.reduce(
      (acc, x) => {
        acc.wall += x.wallSqft;
        acc.ceiling += x.ceilingSqft;
        acc.total += x.total;
        return acc;
      },
      { wall: 0, ceiling: 0, total: 0 }
    );
  }, [perArea]);

  const fmt = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n || 0);

  // 1) prevent default submit on Enter
  return (
    <section className='paint-calculator-wrapper'>
      <div className='sub-heading'>
        <h1>Paint Calculator</h1>
        <h3>This tool is to be used exclusively by Authorized Employees.</h3>
      </div>

      <form className='paint-calculator-form' onSubmit={(e) => e.preventDefault()}>
        {areas.map((area) => {
          const calc = perArea.find((x) => x.id === area.id) || { wallSqft: 0, ceilingSqft: 0, total: 0 };
          return (
            <div key={area.id} className="area-card">
              <div className="area-selection-container">
                <select
                  value={area.name}
                  onChange={(e) => updateArea(area.id, "name", e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value=""> Choose An Area</option>
                  {AREA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
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
                  <Stat label="Walls"   value={fmt(calc.wallSqft)} />
                  <Stat label="Ceiling" value={fmt(calc.ceilingSqft)} />
                  <Stat label="Total"   value={fmt(calc.total)} />
                </div>
              </div>

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
      <div className="">{label}</div>
      <div className="">{value}</div>
    </div>
  );
}
