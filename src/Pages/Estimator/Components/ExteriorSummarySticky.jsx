import React from "react";

export default function ExteriorSummarySticky({
  showSummary,
  setShowSummary,
  totalSqft,
  totalGallons,
  ratePerSqft,
  grandTotal,
  fmtMoney,
  fmt,
}) {
  return (
    <div className={`summary-sticky ${showSummary ? "" : "is-hidden"}`}>
      <div className="grand-total">
        <div className="summary-header">
          <h2>Summary</h2>

          <button
            type="button"
            className="collapse-area-btn"
            onClick={() => setShowSummary((s) => !s)}
            title={showSummary ? "Hide summary details" : "Show summary details"}
          >
            {showSummary ? "Minimize" : "Expand"}
          </button>
        </div>

        {/* COLLAPSED */}
        {!showSummary && (
          <div className="summary-collapsed">
            <div className="summary-big">
              Estimate Total: <span className="summary-amount">{fmtMoney(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* EXPANDED */}
        {showSummary && (
          <div className="total-items">
            <h2 className="mini-row-summary">
              <span className="mini-label">Total Sq Ft:</span>{" "}
              <span className="mini-value">{fmt(totalSqft)}</span>
            </h2>

            <h2 className="mini-row-summary">
              <span className="mini-label">Gallons Needed:</span>{" "}
              <span className="mini-value">{totalGallons} gal</span>
            </h2>

            <h2 className="mini-row-summary">
              <span className="mini-label">Rate:</span>{" "}
              <span className="mini-value">{fmtMoney(ratePerSqft)} / sq ft</span>
            </h2>

            <span className="summary-heading">Estimate</span>

            <h2 className="mini-row-summary">
              <span className="mini-label">Total:</span>{" "}
              <span className="mini-value">{fmtMoney(grandTotal)}</span>
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
