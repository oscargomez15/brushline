import "../../Styling/FindEstimate.css";
import netlifyIdentity from "netlify-identity-widget";
import React, { useEffect, useMemo, useState } from "react";

function prettyUA(ua = "") {
  const s = ua.toLowerCase();
  const browser =
    s.includes("edg") ? "Edge" :
    s.includes("chrome") && !s.includes("edg") ? "Chrome" :
    s.includes("safari") && !s.includes("chrome") ? "Safari" :
    s.includes("firefox") ? "Firefox" :
    s.includes("opr") || s.includes("opera") ? "Opera" :
    "Browser";

  const device =
    s.includes("iphone") ? "iPhone" :
    s.includes("ipad") ? "iPad" :
    s.includes("android") ? "Android" :
    s.includes("mobile") ? "Mobile" :
    "Desktop";

  return `${device} • ${browser}`;
}

function refDomain(ref = "") {
  try {
    const u = new URL(ref);
    return u.hostname;
  } catch {
    return ref ? "Direct/Unknown" : "Direct/Unknown";
  }
}

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

export default function FindEstimates() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyErr, setHistoryErr] = useState("");
  const [historyData, setHistoryData] = useState(null); // { viewCount, lastViewedAt, viewEvents, id }
  
  async function openViewHistory(quoteId) {
  setHistoryErr("");
  setHistoryLoading(true);
  setHistoryData(null);
  setHistoryOpen(true);

  try {
    const user = netlifyIdentity.currentUser();
    const token = user ? await user.jwt() : null;
    if (!token) throw new Error("You must be logged in.");

    const res = await fetch(
      `/.netlify/functions/get-quote-views?id=${encodeURIComponent(quoteId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to load view history");

    setHistoryData(data);
  } catch (e) {
    setHistoryErr(e.message);
  } finally {
    setHistoryLoading(false);
  }
}
  
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

    useEffect(() => {
      const onDocClick = () => setOpenMenuId(null);
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
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
  const typeMap = {
    interior: "Interior",
    exterior: "Exterior",
    handyman: "Handyman",
  };


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
                <th className="right">View Status</th>
                <th className="right">Total</th>
                <th className="right">Open</th>
                <th className="right">Delete</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((x) => {
                const clientInitial = (x.clientName || "?").trim()[0]?.toUpperCase() || "?";
                const typeLabel = typeMap[x.jobType] || x.jobType;
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
                        View
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

                    <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                    
                    <button
                      type="button"
                      className="kebab-btn"
                      onClick={() => setOpenMenuId(openMenuId === x.id ? null : x.id)}
                      aria-label="More actions"
                    >
                      ⋯
                    </button>

                    {openMenuId === x.id && (
                      <div className="kebab-menu">
                        <button
                          type="button"
                          className="kebab-item"
                          onClick={() => {
                            setOpenMenuId(null);
                            openViewHistory(x.id);
                          }}
                        >
                          View history
                        </button>
                      </div>
                    )}
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

      {historyOpen && (
      <div className="modal-backdrop" onClick={() => setHistoryOpen(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div>
              <div className="modal-title">Quote View History</div>
              <div className="modal-sub">
                Quote ID: <span className="mono">{historyData?.id || "—"}</span>
              </div>
            </div>

            <button className="modal-close" onClick={() => setHistoryOpen(false)}>✕</button>
          </div>

          {historyLoading ? (
            <div className="modal-body">Loading…</div>
          ) : historyErr ? (
            <div className="modal-body error">{historyErr}</div>
          ) : (
            <div className="modal-body">
              <div className="history-summary">
                <div><strong>Total views:</strong> {historyData?.viewCount ?? 0}</div>
                <div>
                  <strong>Last viewed:</strong>{" "}
                  {historyData?.lastViewedAt ? new Date(historyData.lastViewedAt).toLocaleString() : "—"}
                </div>
              </div>

              <div className="history-table">
                <div className="hrow head">
                  <div>Time</div>
                  <div>Device</div>
                  <div>Referrer</div>
                  <div>Visitor</div>
                </div>

                {(historyData?.viewEvents || []).length === 0 ? (
                  <div className="hrow empty">
                    <div>No views logged yet.</div>
                  </div>
                ) : (
                  historyData.viewEvents.map((v, i) => (
                    <div className="hrow" key={`${v.at}-${i}`}>
                      <div>{v.at ? new Date(v.at).toLocaleString() : "—"}</div>
                      <div>{prettyUA(v.ua)}</div>
                      <div>{refDomain(v.ref)}</div>
                      <div className="mono">{v.ipHash || "—"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
)}
    </div>
  );
}