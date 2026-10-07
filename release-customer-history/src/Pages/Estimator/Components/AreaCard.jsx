import React from "react";
import { AREA_OPTIONS } from "../constants";
import AreaConditions from "./AreaConditions";
import AreaMeasurements from "./AreaMeasurements";
import AreaCalculations from "./AreaCalculations";

export default function AreaCard({
  area,
  calc,
  onToggle,
  onRemove,
  onUpdate,
  forceDoorInputs,
  forceBaseboardInputs,
  fmtMoney,
  fmt,
  fmtDollar,
  fmtHours,
  dragHandleProps, // ✅ add this
}){
  const addAddon = () => {
  const next = [...(area.addons || [])];
  next.push({ id: `${Date.now()}-${Math.random()}`, label: "", price: "" });
  onUpdate("addons", next);
};

const updateAddon = (addonId, key, value) => {
  const next = (area.addons || []).map(a => a.id === addonId ? { ...a, [key]: value } : a);
  onUpdate("addons", next);
};

const removeAddon = (addonId) => {
  const next = (area.addons || []).filter(a => a.id !== addonId);
  onUpdate("addons", next);
};
  return (
    <div className={`area-card ${area.collapsed ? "is-collapsed" : ""}`}>
      <div className="area-card-header">
        <div className="area-card-title">
          <div className="area-name">{area.name || "Unnamed Area"}</div>

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

          <button type="button" className="collapse-area-btn" onClick={onToggle}>
            {area.collapsed ? "Expand" : "Minimize"}
          </button>

          <button type="button" className="remove-area-btn delete" onClick={onRemove}>
            Remove
          </button>

          <button
          type="button"
          className="drag-handle"
          title="Drag to reorder"
          {...(dragHandleProps || {})}
        >
          ☰
        </button>
        </div>
      </div>

      {area.collapsed ? null : (
        <>
          <div className="area-selection-container">
            <select value={area.name} onChange={(e) => onUpdate("name", e.target.value)}>
              <option value=""> Choose an area</option>
              {AREA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <AreaConditions area={area} calc={calc} onUpdate={onUpdate} />

          <div className="area-calc-body">
            <AreaMeasurements 
            area={area} 
            onUpdate={onUpdate}
            forceDoorInputs={forceDoorInputs}
            forceBaseboardInputs={forceBaseboardInputs} />
            <AreaCalculations
              area={area}
              calc={calc}
              fmt={fmt}
              fmtMoney={fmtMoney}
              fmtDollar={fmtDollar}
              fmtHours={fmtHours}
            />
          </div>
                <div className="addons-box">
        <h3>Extra work</h3>

        {(area.addons || []).map((a) => (
          <div key={a.id} className="addon-row">
            <input
              className="dim-input"
              placeholder="e.g., Drywall repair"
              value={a.label}
              onChange={(e) => updateAddon(a.id, "label", e.target.value)}
            />

            <input
              className="dim-input"
              inputMode="decimal"
              placeholder="$"
              value={a.price}
              onChange={(e) => updateAddon(a.id, "price", e.target.value)}
            />

            <button type="button" className="addon-remove" onClick={() => removeAddon(a.id)}>
              Remove
            </button>
          </div>
        ))}

          <button type="button" className="addon-add" onClick={addAddon}>
            + Add extra work
          </button>
      </div>
        </>
        
      )}


    </div>
  );
}
