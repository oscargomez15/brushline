import React from "react";

export default function AreaScope({ area, onUpdate }) {
  const noneSelected =
    !area.paintWalls && !area.paintCeiling && !area.paintDoors && !area.paintBaseboard;

  return (
    <div className="surfaces-container">
      {noneSelected && (
        <div className="scope-warning">
          Select at least one surface (Walls, Ceiling, Doors, or Baseboard).
        </div>
      )}

      <h3>Scope</h3>

      <div className="options">
        <label className="scope-option">
          <input
            type="checkbox"
            checked={!!area.paintWalls}
            onChange={(e) => onUpdate("paintWalls", e.target.checked)}
          />
          <span>Walls</span>
        </label>

        <label className="scope-option">
          <input
            type="checkbox"
            checked={!!area.paintCeiling}
            onChange={(e) => onUpdate("paintCeiling", e.target.checked)}
          />
          <span>Ceiling</span>
        </label>

        <label className="scope-option">
          <input
            type="checkbox"
            checked={!!area.paintDoors}
            onChange={(e) => onUpdate("paintDoors", e.target.checked)}
          />
          <span>Doors</span>
        </label>

        <label className="scope-option">
          <input
            type="checkbox"
            checked={!!area.paintBaseboard}
            onChange={(e) => onUpdate("paintBaseboard", e.target.checked)}
          />
          <span>Baseboard</span>
        </label>
      </div>
    </div>
  );
}
