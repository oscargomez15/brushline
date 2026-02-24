import React, { useEffect, useMemo, useState } from "react";
import "../../Styling/FindEstimate.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

export default function FindEstimates() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/.netlify/functions/list-quotes?limit=100");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load estimates");
        setItems(data.items || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((x) => {
      const hay = `${x.id} ${x.clientName} ${x.projectAddress} ${x.jobType}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  if (loading) return <div>Loading estimates…</div>;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
  <div className="find-estimates">
    {/* Title row */}
    <div className="fe-header">
      <div>
        <h1 className="fe-title">Find Estimates</h1>
        <p className="fe-subtitle">
          Search, review, and open proposals you’ve generated.
        </p>
      </div>

      <a className="fe-primary-btn" href="/estimates/create">
        + New Estimate
      </a>
    </div>

    {/* Toolbar */}
    <div className="fe-toolbar">
      <div className="fe-search">
        <span className="fe-search-icon" aria-hidden="true">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by client, address, quote #..."
        />
      </div>

      <div className="fe-stats">
        <div className="fe-stat">
          <div className="fe-stat-label">Total</div>
          <div className="fe-stat-value">{items.length}</div>
        </div>
        <div className="fe-stat">
          <div className="fe-stat-label">Showing</div>
          <div className="fe-stat-value">{filtered.length}</div>
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="fe-card">
      <div className="fe-table-wrap">
        <table className="fe-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Address</th>
              <th>Type</th>
              <th>Status</th>
              <th className="right">Total</th>
              <th className="right">Open</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((x) => {
              const clientInitial = (x.clientName || "?").trim()[0]?.toUpperCase() || "?";
              const typeLabel = x.jobType === "exterior" ? "Exterior" : "Interior";
              const typeClass = x.jobType === "exterior" ? "exterior" : "interior";

              return (
                <tr key={x.id}>
                  <td className="muted">
                    {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}
                  </td>

                  <td>
                    <div className="fe-client">
                      <div className="fe-avatar" aria-hidden="true">{clientInitial}</div>
                      <div className="fe-client-meta">
                        <div className="fe-client-name">{x.clientName || "—"}</div>
                        <div className="fe-client-id">#{x.quoteNumber || x.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="muted">{x.projectAddress || "—"}</td>

                  <td>
                    <span className={`fe-pill ${typeClass}`}>{typeLabel}</span>
                  </td>

                  <td>
                    <span className={`fe-pill ${x.status === "approved" ? "approved" : "awaiting"}`}>
                        {x.status === "approved" ? "Approved" : "Awaiting"}
                    </span>
                  </td>

                  <td className="right strong">{fmtMoney(x.grandTotal)}</td>

                  <td className="right">
                    <a className="fe-link" href={`/quote/${x.id}`} target="_blank" rel="noreferrer">
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="fe-empty">
                  No estimates found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}