import React from "react";
import { BASEBOARD_HEIGHT_OPTIONS } from "../constants";
import DimInput from "./DimInput";

export default function AreaMeasurements({ 
  area, 
  onUpdate,
  forceDoorInputs = false,
  forceBaseboardInputs = false }) {
  const showDoorInputs = area.paintDoors || forceDoorInputs;
  const showBaseboardInputs = area.paintBaseboard || forceBaseboardInputs;
  const showRoomDims = area.paintWalls || area.paintCeiling || area.paintBaseboard;

  return (
    <div className="dimensions-container">
      <h3>Measurements (ft)</h3>

      {showRoomDims && (
        <>
          <DimInput label="Length" value={area.length} onChange={(v) => onUpdate("length", v)} />
          <DimInput label="Width" value={area.width} onChange={(v) => onUpdate("width", v)} />
        </>
      )}

      {area.paintWalls && (
        <DimInput label="Height" value={area.height} onChange={(v) => onUpdate("height", v)} />
      )}

      {showBaseboardInputs&& (
        <div className="baseboard-container">
          <h3>Baseboard</h3>

          <label className="flex flex-col gap-1">
            <span>Baseboard Height</span>
            <select
              value={area.baseboardHeightChoice}
              onChange={(e) => onUpdate("baseboardHeightChoice", e.target.value)}
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
              label="Custom Height (in)"
              value={area.baseboardHeightCustomIn}
              onChange={(v) => onUpdate("baseboardHeightCustomIn", v)}
            />
          )}
        </div>
      )}

      {showDoorInputs && (
        <div className="doors-container">
          <h3>Doors Info</h3>

          <label className="flex flex-col gap-1">
            <span>Door Count</span>
            <input
              type="text"
              inputMode="numeric"
              className="dim-input"
              value={area.doorCount}
              onChange={(e) => onUpdate("doorCount", e.target.value)}
            />
          </label>

          <div className="doors-dims">
            <DimInput
              label="Door Width (in)"
              value={area.doorWidthIn}
              onChange={(v) => onUpdate("doorWidthIn", v)}
            />
            <DimInput
              label="Door Height (in)"
              value={area.doorHeightIn}
              onChange={(v) => onUpdate("doorHeightIn", v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
