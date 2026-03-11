import React, { useMemo } from "react";
import "../Styling/ClosingRateWidget.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function ClosingRateWidget({ estimates = [] }) {
  const stats = useMemo(() => {
    const totalQuotes = estimates.length;

    const approvedEstimates = estimates.filter((item) => {
      const status = String(item.status || "").toLowerCase();
      return status === "approved";
    });

    const approvedCount = approvedEstimates.length;

    const totalQuotedValue = estimates.reduce((sum, item) => {
      return sum + Number(item.total || item.estimateTotal || 0);
    }, 0);

    const approvedValue = approvedEstimates.reduce((sum, item) => {
      return sum + Number(item.total || item.estimateTotal || 0);
    }, 0);

    const closingRate =
      totalQuotes > 0 ? (approvedCount / totalQuotes) * 100 : 0;

    const avgApprovedJob =
      approvedCount > 0 ? approvedValue / approvedCount : 0;

    return {
      totalQuotes,
      approvedCount,
      totalQuotedValue,
      approvedValue,
      closingRate,
      avgApprovedJob,
    };
  }, [estimates]);

  return (
    <section className="dashboard-card closing-rate-card">
      <div className="card-header">
        <div>
          <p className="card-eyebrow">Sales Performance</p>
          <h3 className="card-title">Closing Rate</h3>
        </div>
      </div>

      <div className="closing-rate-main">
        <div className="closing-rate-circle">
          <span className="closing-rate-number">
            {stats.closingRate.toFixed(1)}%
          </span>
          <span className="closing-rate-label">Won</span>
        </div>

        <div className="closing-rate-breakdown">
          <div className="metric-row">
            <span>Total Quotes</span>
            <strong>{stats.totalQuotes}</strong>
          </div>

          <div className="metric-row">
            <span>Approved</span>
            <strong>{stats.approvedCount}</strong>
          </div>

          <div className="metric-row">
            <span>Quoted Value</span>
            <strong>{formatCurrency(stats.totalQuotedValue)}</strong>
          </div>

          <div className="metric-row">
            <span>Approved Value</span>
            <strong>{formatCurrency(stats.approvedValue)}</strong>
          </div>

          <div className="metric-row">
            <span>Avg Approved Job</span>
            <strong>{formatCurrency(stats.avgApprovedJob)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}