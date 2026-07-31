import React from "react";
import "../Styling/FindPageSkeleton.css";

export default function FindPageSkeleton({ title = "Records" }) {
  return (
    <div className="find-skeleton" role="status" aria-live="polite" aria-label={`Loading ${title.toLowerCase()}`}>
      <div className="find-skeleton-heading">
        <div>
          <div className="skeleton-line skeleton-kicker" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
        </div>
        <div className="skeleton-block skeleton-action" />
      </div>

      <div className="skeleton-search-panel">
        <div className="skeleton-block skeleton-search" />
        <div className="skeleton-line skeleton-count" />
      </div>

      <div className="skeleton-table" aria-hidden="true">
        <div className="skeleton-table-head" />
        {[0, 1, 2, 3, 4].map((row) => (
          <div className="skeleton-table-row" key={row}>
            <div className="skeleton-circle" />
            <div className="skeleton-row-copy">
              <div className="skeleton-line skeleton-name" />
              <div className="skeleton-line skeleton-detail" />
            </div>
            <div className="skeleton-line skeleton-cell" />
            <div className="skeleton-line skeleton-cell skeleton-cell-short" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading {title.toLowerCase()}…</span>
    </div>
  );
}
