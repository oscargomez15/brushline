import React from "react";
import { PAINT_GRADE_OPTIONS } from "../constants";

export default function SummarySticky({
  showSummary,
  setShowSummary,
  grandTotal,
  totalJobHours,
  totalJobGallons,
  paintGrade,
  totalPaintMaterialCost,
  fmtMoney,
  fmtHours,
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

        {!showSummary && (
          <div className="summary-collapsed">
            <div className="summary-big">
              Job Total: <span className="summary-amount">{fmtMoney(grandTotal)}</span>
            </div>
          </div>
        )}

        {showSummary && (
          <div className="total-items">
            <h2 className="mini-row-summary">
              <span className="mini-label">Job Total:</span>{" "}
              <span className="mini-value">{fmtMoney(grandTotal)}</span>
            </h2>

            <h2 className="mini-row-summary">
              <span className="mini-label">Completion Time:</span>{" "}
              <span className="mini-value">{fmtHours(totalJobHours)}</span>
            </h2>

            <span className="summary-heading">Paint Materials</span>

            <h2 className="mini-row-summary">
              <span className="mini-label">Needed:</span>{" "}
              <span className="mini-value">{totalJobGallons} gal</span>
            </h2>

            <h2 className="mini-row-summary">
              <span className="mini-label">Grade:</span>{" "}
              <span className="mini-value">
                {PAINT_GRADE_OPTIONS.find((g) => g.value === paintGrade)?.label}
              </span>
            </h2>

            <h2 className="mini-row-summary">
              <span className="mini-label">Paint Cost:</span>{" "}
              <span className="mini-value">{fmtMoney(totalPaintMaterialCost)}</span>
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
