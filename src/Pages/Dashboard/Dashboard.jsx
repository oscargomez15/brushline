import React, { useEffect, useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { Link } from "react-router-dom";
import "../../Styling/Dashboard.css";

const DASHBOARD_CACHE_KEY = "brushlineDashboardStats";

function readCachedDashboard() {
  try {
    const cached = JSON.parse(localStorage.getItem(DASHBOARD_CACHE_KEY) || "null");
    return cached?.stats || null;
  } catch {
    return null;
  }
}

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
};

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
  const [stats, setStats] = useState(readCachedDashboard);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(() => !readCachedDashboard());

  useEffect(() => {
    const load = async () => {
      const hasCachedStats = Boolean(readCachedDashboard());
      try {
        if (!hasCachedStats) setLoading(true);
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
        localStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({ stats: data, cachedAt: Date.now() })
        );
      } catch (e) {
        if (!hasCachedStats) {
          setErr(e.message || "Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

    useEffect(() => {
    document.title = "Dashboard | CRM Brushline";
  }, []);

    if (loading) {
    return (
        <div className="dashboard-page">
        <div className="dashboard-head">
            <div className="db-skeleton db-skeleton-title" />
            <div className="db-skeleton db-skeleton-subtitle" />
        </div>

        <div className="dashboard-grid">
            <div className="db-card db-stat-card">
            <div className="db-skeleton db-skeleton-label" />
            <div className="db-skeleton db-skeleton-value" />
            <div className="db-skeleton db-skeleton-text" />
            </div>

            <div className="db-card db-stat-card">
            <div className="db-skeleton db-skeleton-label" />
            <div className="db-skeleton db-skeleton-value" />
            <div className="db-skeleton db-skeleton-text" />
            </div>

            <div className="db-card db-stat-card">
            <div className="db-skeleton db-skeleton-label" />
            <div className="db-skeleton db-skeleton-value" />
            <div className="db-skeleton db-skeleton-text" />
            </div>

            <div className="db-card db-stat-card db-close-card">
            <div className="db-skeleton db-skeleton-label" />
            <div className="db-skeleton db-skeleton-close-main" />
            <div className="db-skeleton db-skeleton-text" />
            <div className="db-skeleton db-skeleton-pill" />
            <div className="db-skeleton db-skeleton-pill" />
            <div className="db-skeleton db-skeleton-pill" />
            </div>

            <div className="db-card db-chart-card">
            <div className="db-skeleton db-skeleton-chart-title" />
            <div className="db-skeleton db-skeleton-chart-subtitle" />
            <div className="db-chart-skeleton">
                {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="db-chart-skeleton-col">
                    <div
                    className="db-skeleton db-chart-skeleton-bar"
                    style={{ height: `${35 + ((i % 5) * 12)}%` }}
                    />
                    <div className="db-skeleton db-chart-skeleton-label" />
                </div>
                ))}
            </div>
            </div>

            <div className="db-card db-placeholder-card tall">
            <div className="db-skeleton db-skeleton-label" />
            <div className="db-skeleton db-skeleton-block" />
            <div className="db-skeleton db-skeleton-block short" />
            </div>
        </div>
        </div>
    );
    }

  if (err) {
    return <div className="dashboard-page" style={{ color: "crimson" }}>Error: {err}</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-head">
        <div>
          <span className="dashboard-eyebrow">Business overview</span>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            A quick look at estimates, approvals, and revenue for {stats?.year}.
          </p>
        </div>
        <div className="dashboard-actions">
          <Link className="dashboard-action secondary" to="/crm/estimates/find">View Estimates</Link>
          <Link className="dashboard-action primary" to="/crm/estimates/create">+ New Estimate</Link>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="db-card db-stat-card db-revenue-card">
            <div className="db-card-label">Approved Revenue (YTD)</div>

            <div className="db-revenue-main">
                {fmtMoney(stats?.approvedRevenueYTD)}
            </div>

            <div className="db-revenue-sub">
                Based on approved quotes this year
            </div>

            <div className="db-revenue-metrics">
                <div className="db-revenue-metric">
                <span>Approved Quotes</span>
                <strong>{stats?.approvedQuotesYTD || 0}</strong>
                </div>

                <div className="db-revenue-metric">
                <span>Average Approved Quote</span>
                <strong>{fmtMoney(stats?.avgApprovedQuote)}</strong>
                </div>
            </div>
        </div>

        <div className="db-card db-stat-card db-pipeline-card">
          <div className="db-card-label">Estimate Pipeline</div>
          <div className="db-card-value">{stats?.pendingQuotesYTD || 0}</div>
          <div className="db-card-subtle">Estimates currently awaiting approval</div>
          <div className="db-pipeline-track" aria-hidden="true">
            <span style={{ width: `${Math.min(100, ((stats?.pendingQuotesYTD || 0) / Math.max(stats?.totalQuotesYTD || 1, 1)) * 100)}%` }} />
          </div>
          <Link className="db-inline-link" to="/crm/estimates/find">Review estimates →</Link>
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

          <div className="db-chart-scroll" role="region" aria-label="Revenue by month chart" tabIndex="0">
            <RevenueChart data={stats?.revenueByMonth || []} />
          </div>
        </div>

        <div className="db-card db-recent-card">
        <div className="db-card-head">
            <div>
            <div className="db-card-title">Recent Approvals</div>
            <div className="db-card-subtle">
                Last 5 approved quotes
            </div>
            </div>
        </div>

        <div className="db-recent-list">
            {(stats?.recentApprovedQuotes || []).length === 0 ? (
            <div className="db-empty-state">No approved quotes yet.</div>
            ) : (
            stats.recentApprovedQuotes.map((quote) => (
                <div key={quote.id} className="db-recent-item">
                <div className="db-recent-main">
                    <div className="db-recent-name">{quote.clientName}</div>
                    <div className="db-recent-date">{fmtDate(quote.approvedAt)}</div>
                </div>

                <div className="db-recent-right">
                    <div className="db-recent-amount">{fmtMoney(quote.grandTotal)}</div>
                    <a
                    className="db-recent-link"
                    href={`/quote/${quote.id}`}
                    target="_blank"
                    rel="noreferrer"
                    >
                    Open
                    </a>
                </div>
                </div>
            ))
            )}
        </div>
        </div>
      </div>
    </div>
  );
}
