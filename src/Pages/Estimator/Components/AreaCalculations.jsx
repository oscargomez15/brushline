import React from "react";
import Stat from "./Stat";

export default function AreaCalculations({
  area,
  calc,
  fmt,
  fmtMoney,
  fmtDollar,
  fmtHours,
}) {
  return (
    <div className="calculations-container">
      <h3>Calculations (sq ft)</h3>

      <div className="calculations-grid">
        {area.paintWalls && (
          <div className="calculations-card">
            <h3>Wall</h3>
            <div className="calculations-items">
              <Stat label="Sq. Ft." value={fmt(calc.wallSqft)} />
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
              <Stat label="Price" value={fmtMoney(calc.ceilingCost)} />
              <Stat label="Time" value={fmtHours(calc.ceilingHours)} />
            </div>
          </div>
        )}

        {area.paintDoors && (
          <div className="calculations-card">
            <h3>Doors</h3>
            <div className="calculations-items">
              <Stat label="Sq. Ft." value={fmt(calc.doorSqft)} />
              <Stat label="Price" value={fmtMoney(calc.doorCost)} />
              <Stat label="Gallons" value={calc.doorGallons} />
            </div>
          </div>
        )}

        {area.paintBaseboard && (
          <div className="calculations-card">
            <h3>Baseboard</h3>
            <div className="calculations-items">
              <Stat label="LF" value={fmt(calc.baseboardLf)} />
              <Stat label="Price" value={fmtMoney(calc.baseboardCost)} />
              <Stat label="Gallons" value={calc.baseboardGallons} />
            </div>
          </div>
        )}

        {/* Paint card stays with the rest */}
        <div className="calculations-card">
          <h3>Paint Supplies</h3>
          <div className="calculations-items">
            {area.paintWalls && <Stat label="Wall Gal" value={calc.wallGallons} />}
            {area.paintCeiling && <Stat label="Ceil Gal" value={calc.ceilingGallons} />}
            {area.paintDoors && <Stat label="Door Gal" value={calc.doorGallons} />}
            {area.paintBaseboard && <Stat label="Base Gal" value={calc.baseboardGallons} />}
          </div>
        </div>
      </div>

      {/* Totals on one line */}
      <div className="calc-totals-row">
        <Stat label="Area Total" value={fmtMoney(calc.totalCost)} />
        <Stat label="Total Gallons" value={calc.totalGallons} />
      </div>
    </div>
  );
}