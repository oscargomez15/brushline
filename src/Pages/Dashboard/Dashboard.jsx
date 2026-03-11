import React, { useEffect, useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import "../../Styling/Dashboard.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

function RevenueChart({ data }) {
  const max = useMemo(() => {
    return Math.max(...data.map((d) => Number(d.revenue) || 0), 1);
  }, [data]);

  return (
    <div className="db-chart">
      {data.map((item) => {
        const value = Number(item.revenue) || 0;
        const heightPct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 8 : 0) : 0;

        return (
          <div key={item.label} className="db-bar-col">
            <div className="db-bar-value">{value > 0 ? fmtMoney(value) : "—"}</div>

            <div className="db-bar-track">
              <div
                className="db-bar-fill"
                style={{ height: `${heightPct}%` }}
                title={`${item.label}: ${fmtMoney(value)}`}
              />
            </div>

            <div className="db-bar-label">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("You must be logged in.");

        const res = await fetch("/.netlify/functions/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load dashboard stats");

        setStats(data);
      } catch (e) {
        setErr(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="dashboard-page">Loading dashboard…</div>;
  }

  if (err) {
    return <div className="dashboard-page" style={{ color: "crimson" }}>Error: {err}</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-head">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Overview of approved quote revenue for {stats?.year}.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="db-card db-stat-card">
          <div className="db-card-label">Approved Revenue (YTD)</div>
          <div className="db-card-value">{fmtMoney(stats?.approvedRevenueYTD)}</div>
          <div className="db-card-subtle">Based on approved quotes</div>
        </div>

        <div className="db-card db-stat-card">
          <div className="db-card-label">Approved Quotes</div>
          <div className="db-card-value">{stats?.approvedQuotesYTD || 0}</div>
          <div className="db-card-subtle">Quotes marked approved this year</div>
        </div>

        <div className="db-card db-stat-card">
          <div className="db-card-label">Average Approved Quote</div>
          <div className="db-card-value">{fmtMoney(stats?.avgApprovedQuote)}</div>
          <div className="db-card-subtle">Average of approved quotes this year</div>
        </div>

        <div className="db-card db-stat-card db-close-card">
        <div className="db-card-label">Closing Rate</div>

        <div className="db-close-rate-row">
            <div className="db-close-rate-main">
            {stats?.closingRateYTD != null ? `${stats.closingRateYTD}%` : "0%"}
            </div>
            <div className="db-close-rate-sub">
            Approved vs total quotes this year
            </div>
        </div>

        <div className="db-close-metrics">
            <div className="db-close-metric">
            <span>Total Quotes</span>
            <strong>{stats?.totalQuotesYTD || 0}</strong>
            </div>

            <div className="db-close-metric">
            <span>Approved</span>
            <strong>{stats?.approvedQuotesYTD || 0}</strong>
            </div>

            <div className="db-close-metric">
            <span>Awaiting Approval</span>
            <strong>{stats?.pendingQuotesYTD || 0}</strong>
            </div>
        </div>
        </div>

        <div className="db-card db-chart-card">
          <div className="db-card-head">
            <div>
              <div className="db-card-title">Revenue by Month</div>
              <div className="db-card-subtle">
                Approved quote totals grouped by month
              </div>
            </div>
          </div>

          <RevenueChart data={stats?.revenueByMonth || []} />
        </div>

        <div className="db-card db-placeholder-card tall">
          <div className="db-card-label">Future Widget</div>
          <div className="db-placeholder-text">
            This area can be used later for recent approvals, pipeline, customer growth, or team performance.
          </div>
        </div>
      </div>
    </div>
  );
}