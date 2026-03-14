import "../../Styling/FindEstimate.css";
import netlifyIdentity from "netlify-identity-widget";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../Styling/FindInvoices.css';

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);

export default function FindInvoices() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    document.title = "Find Invoices | Brushline CRM";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("Please log in first.");

        const res = await fetch("/.netlify/functions/list-invoices?limit=100", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load invoices");

        setItems(data.items || []);
      } catch (e) {
        setErr(e.message || "Failed to load invoices");
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

  const handleDeleteInvoice = async (id) => {
    const ok = window.confirm("Delete this invoice? This can’t be undone.");
    if (!ok) return;

    try {
      setDeletingId(id);

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;
      if (!jwt) throw new Error("Please log in first.");

      const res = await fetch(`/.netlify/functions/delete-invoice?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete invoice");

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
      const hay =
        `${x.id} ${x.invoiceNumber} ${x.clientName} ${x.projectAddress} ${x.jobType} ${x.status} ${x.paymentStatus}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  if (loading) return <div>Loading invoices…</div>;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
    <div className="find-estimates">
      <div className="fe-toolbar">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by client, address, invoice #, or ID..."
          className="fe-search"
        />
      </div>

      <div className="fe-card">
        <div className="fe-table-wrap">
          <table className="fe-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Address</th>
                <th>Status</th>
                <th>Payment</th>
                <th className="right">Total</th>
                <th className="right">Balance</th>
                <th className="right">Delete</th>
                <th className="right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((x) => {
                const clientInitial =
                  (x.clientName || "?").trim()[0]?.toUpperCase() || "?";
                const isDeleting = deletingId === x.id;

                return (
                  <tr
                    key={x.id}
                    className="fe-row-clickable"
                    onClick={() => navigate(`/crm/invoices/edit/${x.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/crm/invoices/edit/${x.id}`);
                      }
                    }}
                  >
                    <td className="muted">
                      {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}
                    </td>

                    <td>
                      <div className="fe-client-meta">
                        <div className="fe-client-name">{x.invoiceNumber || "—"}</div>
                        <div className="fe-client-id">#{x.id}</div>
                      </div>
                    </td>

                    <td>
                      <div className="fe-client">
                        <div className="fe-avatar" aria-hidden="true">
                          {clientInitial}
                        </div>
                        <div className="fe-client-meta">
                          <div className="fe-client-name">{x.clientName || "—"}</div>
                          <div className="fe-client-id">{x.jobType || "—"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="muted">{x.projectAddress || "—"}</td>

                    <td>
                      <span
                        className={`fe-pill ${
                          x.status === "paid"
                            ? "approved"
                            : x.status === "sent"
                            ? "awaiting"
                            : "awaiting"
                        }`}
                      >
                        {x.status || "draft"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`fe-pill ${
                          x.paymentStatus === "paid"
                            ? "approved"
                            : x.paymentStatus === "partial"
                            ? "awaiting"
                            : "awaiting"
                        }`}
                      >
                        {x.paymentStatus || "unpaid"}
                      </span>
                    </td>

                    <td className="right strong">{fmtMoney(x.grandTotal)}</td>
                    <td className="right strong">{fmtMoney(x.balanceDue)}</td>

                    <td className="right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="fe-danger-btn"
                        onClick={() => handleDeleteInvoice(x.id)}
                        disabled={isDeleting}
                        title="Delete invoice"
                      >
                        {isDeleting ? "Deleting…" : "🗑 Delete"}
                      </button>
                    </td>

                    <td className="right" onClick={(e) => e.stopPropagation()}>
                      <div className="kebab-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="kebab-btn"
                          onClick={() =>
                            setOpenMenuId(openMenuId === x.id ? null : x.id)
                          }
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
                                navigate(`/crm/invoices/edit/${x.id}`);
                              }}
                            >
                              Open Invoice
                            </button>

                            {x.linkedQuoteId ? (
                              <button
                                type="button"
                                className="kebab-item"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/quote/${x.linkedQuoteId}`);
                                }}
                              >
                                Open Linked Quote
                              </button>
                            ) : null}
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
                    No invoices found.
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