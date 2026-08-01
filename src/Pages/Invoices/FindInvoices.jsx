import "../../Styling/FindEstimate.css";
import netlifyIdentity from "netlify-identity-widget";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../Styling/FindInvoices.css';
import FindPageSkeleton from "../../Components/FindPageSkeleton";
import { getJobTypeLabel } from "../../utils/jobTypeLabel";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);

const paymentTone = (status = "") => {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "approved";
  if (normalized === "partial") return "info";
  return "awaiting";
};

export default function FindInvoices() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "zelle",
    note: "",
    paidAt: new Date().toISOString().slice(0, 10),
    });

    const openPaymentModal = (invoice) => {
    setPaymentInvoice(invoice);
    setPaymentForm({
        amount: invoice.balanceDue ? String(invoice.balanceDue) : "",
        method: "zelle",
        note: "",
        paidAt: new Date().toISOString().slice(0, 10),
    });
    setPaymentOpen(true);
    };

    const closePaymentModal = () => {
    setPaymentOpen(false);
    setPaymentInvoice(null);
    setPaymentForm({
        amount: "",
        method: "zelle",
        note: "",
        paidAt: new Date().toISOString().slice(0, 10),
    });
    };


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

    const handleRecordPayment = async () => {
    try {
        if (!paymentInvoice) return;

        setRecordingPayment(true);

        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("Please log in first.");

        const res = await fetch("/.netlify/functions/record-invoice-payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
            invoiceId: paymentInvoice.id,
            amount: Number(paymentForm.amount),
            method: paymentForm.method,
            note: paymentForm.note,
            paidAt: paymentForm.paidAt
            ? new Date(`${paymentForm.paidAt}T12:00:00`).toISOString()
            : new Date().toISOString(),
        }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to record payment");

        setItems((prev) =>
        prev.map((item) =>
            item.id === paymentInvoice.id
            ? {
                ...item,
                balanceDue: data.balanceDue,
                paymentStatus: data.paymentStatus,
                }
            : item
        )
        );

        closePaymentModal();
        if (data.emailSent) {
          alert(`Payment recorded and receipt emailed to ${data.emailSentTo}.`);
        } else {
          alert(`Payment recorded. Receipt email was not sent: ${data.emailError || "customer email unavailable"}`);
        }
    } catch (e) {
        alert(e.message);
    } finally {
        setRecordingPayment(false);
    }
    };

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

  if (loading) return <FindPageSkeleton title="Invoices" />;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
    <div className="find-estimates">
      <header className="fe-page-header">
        <div>
          <span className="fe-eyebrow">Invoices</span>
          <h1>Find an invoice</h1>
          <p>Track invoice status, balances, and customer payments quickly.</p>
        </div>
      </header>

      <div className="fe-toolbar">
        <div className="fe-search-wrap">
          <span className="fe-search-icon" aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="invoice-search">Search invoices</label>
          <input
            id="invoice-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search client, address, invoice number, or status"
            className="fe-search"
          />
          {q ? <button type="button" className="fe-clear-search" onClick={() => setQ("")}>Clear</button> : null}
        </div>
        <div className="fe-results-count" aria-live="polite">
          <strong>{filtered.length}</strong> {filtered.length === 1 ? "invoice" : "invoices"}
        </div>
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
                      </div>
                    </td>

                    <td>
                      <div className="fe-client">
                        <div className="fe-avatar" aria-hidden="true">
                          {clientInitial}
                        </div>
                        <div className="fe-client-meta">
                          <div className="fe-client-name">{x.clientName || "—"}</div>
                          <div className="fe-client-id">{getJobTypeLabel(x.jobType)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="muted fe-table-address">{x.projectAddress || "—"}</td>

                    <td>
                      <span
                        className={`fe-pill ${x.status?.toLowerCase() === "paid" ? "approved" : "awaiting"}`}
                      >
                        {x.status || "draft"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`fe-pill ${paymentTone(x.paymentStatus)}`}
                      >
                        {x.paymentStatus || "Unpaid"}
                      </span>
                    </td>

                    <td className="right strong">{fmtMoney(x.grandTotal)}</td>
                    <td className="right strong">{fmtMoney(x.balanceDue)}</td>

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

                            <button
                                type="button"
                                className="kebab-item"
                                onClick={() => {
                                    setOpenMenuId(null);
                                    openPaymentModal(x);
                                }}
                                >
                                Record Payment
                            </button>

                            <button
                              type="button"
                              className="kebab-item kebab-item-danger"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDeleteInvoice(x.id);
                              }}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting…" : "Delete Invoice"}
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
                  <td colSpan={9} className="fe-empty">
                    No invoices found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="fe-mobile-list">
          {filtered.map((x) => {
            const isDeleting = deletingId === x.id;
            return (
              <article className="fe-mobile-card invoice-mobile-card" key={`mobile-${x.id}`}>
                <button type="button" className="fe-mobile-card-main" onClick={() => navigate(`/crm/invoices/edit/${x.id}`)}>
                  <span className="fe-mobile-card-top">
                    <span>
                      <span className="fe-mobile-name">{x.clientName || "Customer"}</span>
                      <span className="fe-mobile-number">{x.invoiceNumber || x.id}</span>
                    </span>
                    <span className="invoice-mobile-balance">
                      <strong className="fe-mobile-total">{fmtMoney(x.balanceDue)}</strong>
                      <small>Balance due</small>
                    </span>
                  </span>
                  <span className="fe-mobile-address">{x.projectAddress || "No project address"}</span>
                  <span className="fe-mobile-meta">
                    <span className={`fe-pill ${x.status?.toLowerCase() === "paid" ? "approved" : "awaiting"}`}>{x.status || "Draft"}</span>
                    <span className={`fe-pill ${paymentTone(x.paymentStatus)}`}>{x.paymentStatus || "Unpaid"}</span>
                  </span>
                  <span className="fe-mobile-date">Total {fmtMoney(x.grandTotal)} · {x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "No date"}</span>
                </button>
                <div className="fe-mobile-actions">
                  <button type="button" className="fe-mobile-open" onClick={() => navigate(`/crm/invoices/edit/${x.id}`)}>Open Invoice</button>
                  <div className="kebab-wrap" onClick={(event) => event.stopPropagation()}>
                    <button type="button" className="kebab-btn" aria-label={`More actions for ${x.clientName || "invoice"}`} aria-expanded={openMenuId === x.id} onClick={() => setOpenMenuId(openMenuId === x.id ? null : x.id)}>⋯</button>
                    {openMenuId === x.id ? (
                      <div className="kebab-menu" role="menu">
                        <button type="button" className="kebab-item" onClick={() => { setOpenMenuId(null); openPaymentModal(x); }}>Record Payment</button>
                        {x.linkedQuoteId ? <button type="button" className="kebab-item" onClick={() => navigate(`/quote/${x.linkedQuoteId}`)}>Open Linked Quote</button> : null}
                        <button type="button" className="kebab-item fe-mobile-delete" disabled={isDeleting} onClick={() => { setOpenMenuId(null); handleDeleteInvoice(x.id); }}>{isDeleting ? "Deleting…" : "Delete Invoice"}</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 ? <div className="fe-empty fe-mobile-empty">No invoices found.</div> : null}
        </div>
      </div>
      {paymentOpen && paymentInvoice && (
        <div className="modal-backdrop" onClick={closePaymentModal}>
            <div className="modal-card payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
                <div>
                <div className="modal-title">Record Payment</div>
                <div className="modal-sub">
                    {paymentInvoice.invoiceNumber || paymentInvoice.id} • {paymentInvoice.clientName || "Customer"}
                </div>
                </div>

                <button className="modal-close" onClick={closePaymentModal}>✕</button>
            </div>

            <div className="modal-body">
                <div className="payment-summary">
                <div><strong>Total:</strong> {fmtMoney(paymentInvoice.grandTotal)}</div>
                <div><strong>Current Balance:</strong> {fmtMoney(paymentInvoice.balanceDue)}</div>
                <div><strong>Status:</strong> {paymentInvoice.paymentStatus || "unpaid"}</div>
                </div>

                <div className="payment-form-grid">
                <div className="payment-field">
                    <label className="payment-label">Amount</label>
                    <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="payment-input"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    />
                </div>

                <div className="payment-field">
                    <label className="payment-label">Method</label>
                    <select
                    className="payment-input"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}
                    >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="zelle">Zelle</option>
                    <option value="card">Card</option>
                    <option value="stripe">Stripe</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                    </select>
                </div>

                <div className="payment-field">
                    <label className="payment-label">Payment Date</label>
                    <input
                    type="date"
                    className="payment-input"
                    value={paymentForm.paidAt}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidAt: e.target.value }))}
                    />
                </div>

                <div className="payment-field payment-field-full">
                    <label className="payment-label">Note</label>
                    <textarea
                    className="payment-textarea"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Optional note about this payment"
                    />
                </div>
                </div>

                <div className="payment-actions">
                <button className="quote-action-btn" onClick={closePaymentModal}>
                    Cancel
                </button>
                <button
                    className="fe-primary-btn"
                    onClick={handleRecordPayment}
                    disabled={recordingPayment}
                >
                    {recordingPayment ? "Recording..." : "Record Payment"}
                </button>
                </div>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}
