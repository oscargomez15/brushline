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

      {(showRoomDims || area.paintWalls) && (
        <div className="measurements-row">
          {showRoomDims && (
            <>
              <DimInput
                label="Length"
                value={area.length}
                onChange={(v) => onUpdate("length", v)}
              />
              <DimInput
                label="Width"
                value={area.width}
                onChange={(v) => onUpdate("width", v)}
              />
            </>
          )}

          {area.paintWalls && (
            <DimInput
              label="Height"
              value={area.height}
              onChange={(v) => onUpdate("height", v)}
            />
          )}
        </div>
      )}

        {showDoorInputs && (
        <div className="doors-container">
          <h3>Doors Info</h3>

          <div className="doors-row">
            <div className="door-counter">
              <span className="counter-label">Door Count</span>

              <div className="counter-controls">
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() =>
                    onUpdate("doorCount", Math.max(0, Number(area.doorCount || 0) - 1))
                  }
                >
                  −
                </button>

                <div className="counter-value">
                  {Number(area.doorCount || 0)}
                </div>

                <button
                  type="button"
                  className="counter-btn"
                  onClick={() =>
                    onUpdate("doorCount", Number(area.doorCount || 0) + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>

            <DimInput
              label="Width (in)"
              value={area.doorWidthIn}
              onChange={(v) => onUpdate("doorWidthIn", v)}
            />

            <DimInput
              label="Height (in)"
              value={area.doorHeightIn}
              onChange={(v) => onUpdate("doorHeightIn", v)}
            />
          </div>
        </div>
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


    </div>
  );
}
