import React from "react";

export default function ExteriorSummarySticky({
  showSummary,
  setShowSummary,
  totalSqft,
  totalGallons,
  ratePerSqft,
  laborTotal,
  paintType,
  paintCost,
  paintPricePerGallon,
  addOnsTotal,
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
          >
            {showSummary ? "Minimize" : "Expand"}
          </button>
        </div>

        {!showSummary && (
          <div className="summary-collapsed">
            <div className="summary-big">
              Estimate Total:{" "}
              <span className="summary-amount">{fmtMoney(grandTotal)}</span>
            </div>
          </div>
        )}

        {showSummary && (
          <div className="total-items">
            <div className="mini-row-summary">
              <span className="mini-label">Total Sq Ft</span>
              <span className="mini-value">{fmt(totalSqft)}</span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Gallons Needed</span>
              <span className="mini-value">{totalGallons} gal</span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Paint Type</span>
              <span className="mini-value">{paintType}</span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Paint Price</span>
              <span className="mini-value">
                {fmtMoney(paintPricePerGallon)} / gal
              </span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Paint Cost</span>
              <span className="mini-value">{fmtMoney(paintCost)}</span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Labor</span>
              <span className="mini-value">{fmtMoney(laborTotal)}</span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Add-ons</span>
              <span className="mini-value">{fmtMoney(addOnsTotal)}</span>
            </div>

            <div className="mini-row-summary">
              <span className="mini-label">Rate</span>
              <span className="mini-value">{fmtMoney(ratePerSqft)} / sq ft</span>
            </div>

            <div className="mini-row-summary estimate-total-row">
              <span className="mini-label">Estimate Total</span>
              <span className="mini-value">{fmtMoney(grandTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}