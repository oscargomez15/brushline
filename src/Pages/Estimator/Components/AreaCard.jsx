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
  fmtMoney,
  fmt,
  fmtDollar,
  fmtHours,
  dragHandleProps, // ✅ add this
}) {
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
            <AreaMeasurements area={area} onUpdate={onUpdate} />
            <AreaCalculations
              area={area}
              calc={calc}
              fmt={fmt}
              fmtMoney={fmtMoney}
              fmtDollar={fmtDollar}
              fmtHours={fmtHours}
            />
          </div>
        </>
      )}
    </div>
  );
}
