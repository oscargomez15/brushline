import React from "react";

export default function DimInput({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span>{label}</span>
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
