import React, { useEffect, useMemo, useState } from "react";
import "../../Styling/FindEstimate.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

export default function FindEstimates() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this estimate? This can’t be undone.");
    if (!ok) return;

    try {
      setDeletingId(id);

      // If your function expects JSON, switch to POST and send body.
      // This uses a simple querystring approach:
      const res = await fetch(`/.netlify/functions/delete-quote?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete estimate.");

      // Remove from UI
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeletingId(null);
    }
  };

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
      <div className="fe-toolbar">
        <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by client, address, or ID..."
            className="fe-search"
        />
        </div>

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
                <th className="right">View Status</th>
                <th className="right">Open</th>
                <th className="right">Delete</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((x) => {
                const clientInitial = (x.clientName || "?").trim()[0]?.toUpperCase() || "?";
                const typeLabel = x.jobType === "exterior" ? "Exterior" : "Interior";
                const typeClass = x.jobType === "exterior" ? "exterior" : "interior";
                const isDeleting = deletingId === x.id;

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

                    <td>
                      {x.viewCount > 0 ? (
                        <span className="fe-pill approved">Viewed</span>
                      ) : (
                        <span className="fe-pill awaiting">Not viewed</span>
                      )}
                    </td>

                    <td className="right strong">{fmtMoney(x.grandTotal)}</td>

                    <td className="right">
                      <a href={`/quote/${q.id}`} className="view-quote-btn">
                        View Quote →
                      </a>
                    </td>



                    <td className="right">
                      <button
                        className="fe-danger-btn"
                        onClick={() => handleDelete(x.id)}
                        disabled={isDeleting}
                        title="Delete estimate"
                      >
                        {isDeleting ? "Deleting…" : "🗑 Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="fe-empty">
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