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
  );
}
