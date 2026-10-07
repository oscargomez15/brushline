import React from "react";

export default function Stat({ label, value }) {
  return (
    <div>
      <div className="calculation-label">{label}</div>
      <div>{value}</div>
    </div>
  );
}
