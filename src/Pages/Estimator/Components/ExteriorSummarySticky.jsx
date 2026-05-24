import React from "react";
import '../../../Styling/SummarySticky.css';

export default function ExteriorSummarySticky({
  showSummary,
  setShowSummary,
  totalSqft,
  totalGallons,
  ratePerSqft,
  paintType,
  paintCost,
  paintPricePerGallon,
  addOnsTotal,
  grandTotal,
  fmtMoney,
  fmt,
  primerGallons,
  primerPricePerGallon,
  primerCost,
  rawMaterialCost,
  materialMarkup,
  materialMarkupAmount,
  totalMaterialCost,
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
          <div className="total-items summary-grid">
            <div className="summary-group">
              <h3>Measurements</h3>

              <div className="summary-row">
                <span>Total Sq Ft</span>
                <strong>{fmt(totalSqft)}</strong>
              </div>

              <div className="summary-row">
                <span>Gallons Needed</span>
                <strong>{totalGallons} gal</strong>
              </div>

              <div className="summary-row">
                <span>Rate</span>
                <strong>{fmtMoney(ratePerSqft)} / sq ft</strong>
              </div>
            </div>

            <div className="summary-group">
              <h3>Materials</h3>

              <div className="summary-row">
                <span>Primer</span>
                <strong>{primerGallons} gal × {fmtMoney(primerPricePerGallon)}</strong>
              </div>

              <div className="summary-row">
                <span>Primer Cost</span>
                <strong>{fmtMoney(primerCost)}</strong>
              </div>

              <div className="summary-row">
                <span>Paint Type</span>
                <strong>{paintType}</strong>
              </div>

              <div className="summary-row">
                <span>Paint Price</span>
                <strong>{fmtMoney(paintPricePerGallon)} / gal</strong>
              </div>

            <div className="summary-row">
              <span>Raw Materials</span>
              <strong>
                {fmtMoney(rawMaterialCost)}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                Material Markup ({materialMarkup}%)
              </span>

              <strong>
                {fmtMoney(materialMarkupAmount)}
              </strong>
            </div>

            <div className="summary-row">
              <span>Total Materials</span>

              <strong>
                {fmtMoney(totalMaterialCost)}
              </strong>
            </div>
            </div>

            <div className="summary-group total-summary-card">
              <h3>Total</h3>

              <div className="summary-row">
                <span>Add-ons</span>
                <strong>{fmtMoney(addOnsTotal)}</strong>
              </div>

              <div className="summary-row grand">
                <span>Estimate Total</span>
                <strong>{fmtMoney(grandTotal)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}