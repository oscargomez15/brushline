import "../../Styling/FindEstimate.css";
import netlifyIdentity from "netlify-identity-widget";
import { getQuoteNumber } from "../../utils/quoteNumber";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FindPageSkeleton from "../../Components/FindPageSkeleton";

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

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export default function FindEstimates() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [creatingInvoiceId, setCreatingInvoiceId] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyErr, setHistoryErr] = useState("");
  const [historyData, setHistoryData] = useState(null); // { viewCount, lastViewedAt, viewEvents, id }
  const [resendingId, setResendingId] = useState(null);

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
    document.title = "Find Quotes | Brushline CRM";
  }, []);
  
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

    useEffect(() => {
  const close = () => setOpenMenuId(null);
  window.addEventListener("scroll", close, true);
  return () => window.removeEventListener("scroll", close, true);
}, []);

  const handleResendQuoteEmail = async (quoteId) => {
    try {
      setResendingId(quoteId);

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;

      if (!jwt) {
        throw new Error("Please log in first.");
      }

      const res = await fetch("/.netlify/functions/resend-quote-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ quoteId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to resend quote email");

      alert(`Quote email sent to ${data.sentTo}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setResendingId(null);
    }
  };

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

  const handleCreateInvoice = async (quoteId) => {
    try {
      setCreatingInvoiceId(quoteId);

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;

      if (!jwt) {
        throw new Error("Please log in first.");
      }

      const res = await fetch("/.netlify/functions/create-invoice-from-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ quoteId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create invoice");
      }

      navigate(`/crm/invoices/edit/${data.id}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setCreatingInvoiceId(null);
    }
  };

const handleRegeneratePdf = async (quoteId) => {
  try {
    setRegeneratingId(quoteId);

    const user = netlifyIdentity.currentUser();
    const jwt = user ? await user.jwt() : null;

    if (!jwt) {
      throw new Error("Please log in first.");
    }

    const res = await fetch("/.netlify/functions/regenerate-quote-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ id: quoteId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Failed to regenerate PDF");
    }

    alert("PDF regenerated successfully.");
  } catch (e) {
    alert(e.message);
  } finally {
    setRegeneratingId(null);
  }
};

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((x) => {
      const hay = `${x.id} ${getQuoteNumber(x)} ${x.clientName} ${x.projectAddress} ${x.jobType}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  if (loading) return <FindPageSkeleton title="Estimates" />;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;
  const typeMap = {
    interior: "Interior",
    exterior: "Exterior",
    handyman: "Handyman",
    drywall: "Drywall",
  };


  return (
    <div className="find-estimates">
      <header className="fe-page-header">
        <div>
          <span className="fe-eyebrow">Estimates</span>
          <h1>Find an estimate</h1>
          <p>Search, review, and manage every customer estimate in one place.</p>
        </div>
        <button type="button" className="fe-primary-btn" onClick={() => navigate("/crm/estimates/create")}>
          + New Estimate
        </button>
      </header>

      <div className="fe-toolbar">
        <div className="fe-search-wrap">
          <span className="fe-search-icon" aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="estimate-search">Search estimates</label>
          <input
              id="estimate-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search client, address, estimate number, or job type"
              className="fe-search"
          />
          {q ? <button type="button" className="fe-clear-search" onClick={() => setQ("")}>Clear</button> : null}
        </div>
        <div className="fe-results-count" aria-live="polite">
          <strong>{filtered.length}</strong> {filtered.length === 1 ? "estimate" : "estimates"}
        </div>
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
                <th className="right">Delete</th>
                <th className="right">Actions</th>

              </tr>
            </thead>

            <tbody>
              {filtered.map((x) => {
                const clientInitial = (x.clientName || "?").trim()[0]?.toUpperCase() || "?";
                const typeLabel = typeMap[x.jobType] || x.jobType;
                const typeClass = ["exterior", "drywall"].includes(x.jobType) ? x.jobType : "interior";
                const isDeleting = deletingId === x.id;

                return (
                  <tr
                    key={x.id}
                    className="fe-row-clickable"
                    onClick={() => navigate(`/quote/${x.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/quote/${x.id}`);
                      }
                    }}
                  >
                    <td className="muted">
                      {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}
                    </td>

                    <td>
                      <div className="fe-client">
                        <div className="fe-avatar" aria-hidden="true">{clientInitial}</div>
                        <div className="fe-client-meta">
                          <div className="fe-client-name">{x.clientName || "—"}</div>
                          <div className="fe-client-id">#{getQuoteNumber(x)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="muted">
                      {x.projectAddress ? (
                        <a
                          className="fe-address-link"
                          href={mapsUrl(x.projectAddress)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Open ${x.projectAddress} in Google Maps`}
                        >
                          {x.projectAddress}
                        </a>
                      ) : "—"}
                    </td>

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

                    <td className="right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="fe-danger-btn"
                        onClick={() => handleDelete(x.id)}
                        disabled={isDeleting}
                        title="Delete estimate"
                      >
                        {isDeleting ? "Deleting…" : "🗑 Delete"}
                      </button>
                    </td>

                    <td className="right" onClick={(e) => e.stopPropagation()}>
                      <div className="kebab-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="kebab-btn"
                          onClick={() => setOpenMenuId(openMenuId === x.id ? null : x.id)}
                          aria-label="More actions"
                          aria-expanded={openMenuId === x.id}
                        >
                          ⋯
                        </button>

                        {openMenuId === x.id && (
                          <div className="kebab-menu" role="menu">
                            <button
                              type="button"
                              className="kebab-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/crm/estimates/edit/${x.id}`);
                              }}
                            >
                              Edit Quote
                            </button>

                            <button
                              type="button"
                              className="kebab-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleResendQuoteEmail(x.id);
                              }}
                              disabled={resendingId === x.id}
                            >
                              {resendingId === x.id ? "Resending..." : "Resend Quote Email"}
                            </button>

                            <button
                              type="button"
                              className="kebab-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleCreateInvoice(x.id);
                              }}
                              disabled={creatingInvoiceId === x.id}
                            >
                              {creatingInvoiceId === x.id
                                ? "Creating Invoice..."
                                : x.linkedInvoiceId
                                  ? "Open Invoice"
                                  : "Create Invoice"}
                            </button>

                            <button
                              type="button"
                              className="kebab-item"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                openViewHistory(x.id);
                              }}
                            >
                              View history
                            </button>

                            <button
                              type="button"
                              className="kebab-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleRegeneratePdf(x.id);
                              }}
                              disabled={regeneratingId === x.id}
                            >
                              {regeneratingId === x.id ? "Updating PDF..." : "Update PDF Style"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="fe-empty">
                    No estimates found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="fe-mobile-list">
          {filtered.map((x) => {
            const typeLabel = typeMap[x.jobType] || x.jobType;
            const typeClass = ["exterior", "drywall"].includes(x.jobType) ? x.jobType : "interior";
            const isDeleting = deletingId === x.id;

            return (
              <article className="fe-mobile-card" key={`mobile-${x.id}`}>
                <div className="fe-mobile-card-main">
                  <span className="fe-mobile-card-top">
                    <span>
                      <span className="fe-mobile-name">{x.clientName || "Customer"}</span>
                      <span className="fe-mobile-number">#{getQuoteNumber(x)}</span>
                    </span>
                    <strong className="fe-mobile-total">{fmtMoney(x.grandTotal)}</strong>
                  </span>
                  {x.projectAddress ? (
                    <a
                      className="fe-mobile-address fe-address-link"
                      href={mapsUrl(x.projectAddress)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${x.projectAddress} in Google Maps`}
                    >
                      {x.projectAddress}
                    </a>
                  ) : (
                    <span className="fe-mobile-address">No project address</span>
                  )}
                  <span className="fe-mobile-meta">
                    <span className={`fe-pill ${typeClass}`}>{typeLabel}</span>
                    <span className={`fe-pill ${x.status === "approved" ? "approved" : "awaiting"}`}>
                      {x.status === "approved" ? "Approved" : "Awaiting"}
                    </span>
                    <span className={`fe-pill ${x.viewCount > 0 ? "approved" : "awaiting"}`}>
                      {x.viewCount > 0 ? "Viewed" : "Not viewed"}
                    </span>
                  </span>
                  <span className="fe-mobile-date">
                    {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "No date"}
                  </span>
                </div>

                <div className="fe-mobile-actions">
                  <button type="button" className="fe-mobile-open" onClick={() => navigate(`/quote/${x.id}`)}>
                    Open Estimate
                  </button>
                  <div
                    className="kebab-wrap"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="kebab-btn"
                      onClick={() => setOpenMenuId(openMenuId === x.id ? null : x.id)}
                      aria-label={`More actions for ${x.clientName || "estimate"}`}
                      aria-expanded={openMenuId === x.id}
                    >⋯</button>
                    {openMenuId === x.id && (
                      <div className="kebab-menu" role="menu">
                        <button type="button" className="kebab-item" onClick={() => navigate(`/crm/estimates/edit/${x.id}`)}>Edit Quote</button>
                        <button type="button" className="kebab-item" onClick={() => handleResendQuoteEmail(x.id)} disabled={resendingId === x.id}>
                          {resendingId === x.id ? "Resending..." : "Resend Quote Email"}
                        </button>
                        <button type="button" className="kebab-item" onClick={() => handleCreateInvoice(x.id)} disabled={creatingInvoiceId === x.id}>
                          {creatingInvoiceId === x.id ? "Creating Invoice..." : x.linkedInvoiceId ? "Open Invoice" : "Create Invoice"}
                        </button>
                        <button type="button" className="kebab-item" onClick={() => openViewHistory(x.id)}>View History</button>
                        <button type="button" className="kebab-item fe-mobile-delete" onClick={() => handleDelete(x.id)} disabled={isDeleting}>
                          {isDeleting ? "Deleting..." : "Delete Estimate"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 && <div className="fe-empty">No estimates found.</div>}
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
