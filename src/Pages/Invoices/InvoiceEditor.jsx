import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const emptyInvoice = {
  invoiceNumber: "",
  clientName: "",
  email: "",
  phone: "",
  projectAddress: "",
  status: "draft",
  paymentStatus: "unpaid",
  createdAt: new Date().toISOString(),
  dueDate: "",
  notes: "",
  terms: "Payment due upon receipt unless otherwise stated.",
  lineItems: [],
  subtotal: 0,
  tax: 0,
  grandTotal: 0,
  depositPaid: 0,
  balanceDue: 0,
  companyName: "Brushline Services",
  linkedQuoteId: "",
};

function normalizeItems(invoice) {
  if (Array.isArray(invoice?.lineItems) && invoice.lineItems.length) {
    return invoice.lineItems.map((item, i) => {
      const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
      const unitPrice = Number(item.unitPrice ?? item.price ?? item.amount ?? 0) || 0;
      const total = Number(item.total ?? qty * unitPrice) || 0;

      return {
        id: item.id || `line-${i}`,
        description: item.description || item.name || `Line item ${i + 1}`,
        qty,
        unitPrice,
        total,
      };
    });
  }

  if (Number(invoice?.grandTotal) > 0) {
    return [
      {
        id: "line-1",
        description: invoice?.jobType ? `${invoice.jobType} service` : "Service",
        qty: 1,
        unitPrice: Number(invoice.grandTotal) || 0,
        total: Number(invoice.grandTotal) || 0,
      },
    ];
  }

  return [];
}

export default function InvoiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [invoice, setInvoice] = useState(emptyInvoice);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendInvoice = async () => {
try {
    setSending(true);
    setErr("");

    const user = netlifyIdentity.currentUser();
    const jwt = user ? await user.jwt() : null;
    if (!jwt) throw new Error("Please log in first.");

    if (!id) {
    throw new Error("Please save the invoice before sending it.");
    }

    const res = await fetch("/.netlify/functions/send-invoice-email", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ invoiceId: id }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to send invoice");

    alert(`Invoice sent to ${data.sentTo}`);
} catch (e) {
    setErr(e.message || "Failed to send invoice");
} finally {
    setSending(false);
}
};
  useEffect(() => {
    document.title = isEdit ? "Edit Invoice | Brushline CRM" : "Create Invoice | Brushline CRM";
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("Please log in first.");

        const res = await fetch(`/.netlify/functions/get-invoice?id=${encodeURIComponent(id)}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load invoice");

        setInvoice({
          ...emptyInvoice,
          ...data,
          lineItems: normalizeItems(data),
        });
      } catch (e) {
        setErr(e.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const items = useMemo(() => normalizeItems(invoice), [invoice]);

  const subtotal = useMemo(() => {
    if (Number(invoice.subtotal) > 0) return Number(invoice.subtotal) || 0;
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [invoice.subtotal, items]);

  const tax = Number(invoice.tax) || 0;
  const grandTotal = Number(invoice.grandTotal) > 0 ? Number(invoice.grandTotal) : subtotal + tax;
  const depositPaid = Number(invoice.depositPaid) || 0;
  const balanceDue = Number(invoice.balanceDue) > 0 || grandTotal === 0
    ? Number(invoice.balanceDue) || 0
    : Math.max(0, grandTotal - depositPaid);

  const setField = (key, value) => {
    setInvoice((prev) => ({ ...prev, [key]: value }));
  };

  const updateLineItem = (index, patch) => {
    setInvoice((prev) => {
      const next = [...normalizeItems(prev)];
      const current = next[index] || { description: "", qty: 1, unitPrice: 0, total: 0 };
      const updated = { ...current, ...patch };
      const qty = Number(updated.qty) || 0;
      const unitPrice = Number(updated.unitPrice) || 0;
      updated.total = qty * unitPrice;
      next[index] = updated;
      return { ...prev, lineItems: next };
    });
  };

  const makeLineId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const addLineItem = () => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: [...normalizeItems(prev), { id: makeLineId(), description: "", qty: 1, unitPrice: 0, total: 0 }],
    }));
  };

  const removeLineItem = (index) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: normalizeItems(prev).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErr("");

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;
      if (!jwt) throw new Error("Please log in first.");

      const payload = {
        ...invoice,
        id,
        lineItems: items,
        subtotal,
        tax,
        grandTotal,
        depositPaid,
        balanceDue,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch("/.netlify/functions/save-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save invoice");

      if (!id && data?.id) {
        navigate(`/crm/invoices/edit/${data.id}`, { replace: true });
        return;
      }

      setInvoice((prev) => ({ ...prev, ...payload }));
      alert("Invoice saved.");
    } catch (e) {
      setErr(e.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="invoice-page"><div className="invoice-state">Loading invoice…</div></div>;
  }

  return (
    <div className="invoice-page">
      <style>{`
        .invoice-page {
          padding: 24px;
          background: #f4f6f8;
          min-height: 100vh;
        }
        .invoice-shell {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }
        .invoice-toolbar,
        .invoice-card,
        .invoice-side-card {
          background: #fff;
          border: 1px solid rgba(15,23,42,.08);
          border-radius: 18px;
          box-shadow: 0 10px 28px rgba(15,23,42,.06);
        }
        .invoice-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          flex-wrap: wrap;
        }
        .invoice-toolbar-left h1 {
          margin: 0;
          font-size: 26px;
          color: #0f172a;
        }
        .invoice-toolbar-left p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }
        .invoice-toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn {
          height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,.12);
          background: #fff;
          color: #0f172a;
          font-weight: 800;
          cursor: pointer;
        }
        .btn.primary {
          background: #0f172a;
          color: #fff;
          border-color: #0f172a;
        }
        .btn.success {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }
        .btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
        .invoice-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 340px;
          gap: 18px;
        }
        .invoice-card {
          padding: 24px;
        }
        .invoice-side-card {
          padding: 18px;
        }
        .invoice-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(15,23,42,.08);
          margin-bottom: 20px;
        }
        .brand-title {
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -.03em;
          margin: 0;
          color: #0f172a;
        }
        .brand-sub {
          margin-top: 8px;
          color: #475569;
          line-height: 1.5;
          font-size: 14px;
        }
        .invoice-badge {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          border: 1px solid rgba(15,23,42,.08);
          background: #f8fafc;
        }
        .invoice-badge.paid { background: rgba(34,197,94,.12); color: #166534; border-color: rgba(34,197,94,.2); }
        .invoice-badge.partial { background: rgba(245,158,11,.12); color: #92400e; border-color: rgba(245,158,11,.2); }
        .invoice-badge.unpaid,
        .invoice-badge.draft { background: rgba(239,68,68,.08); color: #991b1b; border-color: rgba(239,68,68,.15); }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .meta-box {
          border: 1px solid rgba(15,23,42,.08);
          border-radius: 14px;
          padding: 14px;
          background: #fafafa;
        }
        .meta-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
        }
        .meta-value {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .bill-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .section-title-invoice {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: .08em;
          line-height: 1;
        }
        .bill-box {
          border: 1px solid rgba(15,23,42,.08);
          border-radius: 14px;
          padding: 16px;
          background: #fff;
        }
        .bill-name {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .bill-text {
          color: #475569;
          line-height: 1.6;
          font-size: 14px;
          white-space: pre-line;
        }
        .field-grid {
          display: grid;
          gap: 12px;
        }
        .field-row-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .field-row-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .field {
          display: grid;
          gap: 6px;
        }
        .label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: #64748b;
        }
        .input, .textarea, .select {
          width: 100%;
          border: 1px solid rgba(15,23,42,.14);
          background: #fff;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
        }
        .textarea {
          min-height: 110px;
          resize: vertical;
        }
        .items-wrap {
          margin-top: 20px;
        }
        .items-head,
        .item-row {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) 90px 130px 130px 90px;
          gap: 10px;
          align-items: center;
        }
        .items-head {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #64748b;
          padding: 0 0 10px;
        }
        .item-row {
          padding: 12px 0;
          border-top: 1px solid rgba(15,23,42,.08);
        }
        .inline-total {
          font-weight: 900;
          text-align: right;
          color: #0f172a;
        }
        .remove-btn {
          border: 1px solid rgba(239,68,68,.18);
          background: #fff;
          color: #b91c1c;
          border-radius: 10px;
          padding: 10px 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .summary-box {
          display: grid;
          gap: 12px;
        }
        .summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 15px;
          color: #334155;
        }
        .summary-row.total {
          padding-top: 12px;
          border-top: 1px solid rgba(15,23,42,.08);
          font-size: 20px;
          font-weight: 950;
          color: #0f172a;
        }
        .balance-card {
          margin-top: 14px;
          padding: 16px;
          border-radius: 14px;
          background: #0f172a;
          color: #fff;
        }
        .balance-label {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
          opacity: .7;
        }
        .balance-value {
          margin-top: 6px;
          font-size: 28px;
          font-weight: 950;
        }
        .mini-note {
          margin-top: 10px;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
        }
        .invoice-state {
          max-width: 1100px;
          margin: 0 auto;
          background: #fff;
          border-radius: 18px;
          padding: 24px;
          border: 1px solid rgba(239,68,68,.12);
          color: #b91c1c;
          font-weight: 700;
        }
        @media print {
          .invoice-toolbar,
          .invoice-side,
          .field-grid {
            display: none !important;
          }
          .invoice-page {
            background: #fff;
            padding: 0;
          }
          .invoice-grid {
            grid-template-columns: 1fr;
          }
          .invoice-card {
            box-shadow: none;
            border: none;
            padding: 0;
          }
        }
        @media (max-width: 980px) {
          .invoice-grid { grid-template-columns: 1fr; }
          .meta-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 680px) {
          .invoice-page { padding: 12px; }
          .invoice-card, .invoice-side-card { padding: 16px; }
          .invoice-head { flex-direction: column; }
          .meta-grid, .bill-grid, .field-row-2, .field-row-3 { grid-template-columns: 1fr; }
          .items-head { display: none; }
          .item-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 14px 0;
          }
          .inline-total { text-align: left; }
        }

        .invoice-badge.status-draft {
            background: rgba(15,23,42,.05);
            color: #334155;
            border-color: rgba(15,23,42,.08);
            }

            .invoice-badge.status-sent {
            background: rgba(37,99,235,.12);
            color: #1d4ed8;
            border-color: rgba(37,99,235,.2);
            }

            .invoice-badge.status-void {
            background: rgba(239,68,68,.12);
            color: #991b1b;
            border-color: rgba(239,68,68,.2);
            }

            .invoice-badge.pay-paid {
            background: rgba(34,197,94,.12);
            color: #166534;
            border-color: rgba(34,197,94,.2);
            }

            .invoice-badge.pay-partial {
            background: rgba(245,158,11,.12);
            color: #92400e;
            border-color: rgba(245,158,11,.2);
            }

            .invoice-badge.pay-unpaid {
            background: rgba(15,23,42,.05);
            color: #334155;
            border-color: rgba(15,23,42,.08);
            }
      `}</style>

      <div className="invoice-shell">
        <div className="invoice-toolbar">
          <div className="invoice-toolbar-left">
            <h1>{isEdit ? "Invoice" : "Create Invoice"}</h1>
          </div>

          <div className="invoice-toolbar-actions">
            <button className="btn" onClick={() => navigate(-1)}>Back</button>
            <button className="btn" onClick={() => window.print()}>Print</button>
            <button className="btn primary" onClick={handleSendInvoice} disabled={sending || !id}>
              {sending ? "Sending..." : "Send Invoice"}
            </button>
            <button className="btn success" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>

        {err ? <div className="invoice-state">{err}</div> : null}

        <div className="invoice-grid">
          <div className="invoice-card">
            
            <div className="invoice-head">
              <div>
                <h2 className="brand-title">{invoice.companyName || "Brushline Services"}</h2>
                <div className="brand-sub">
                  Painting & Home Improvement Services<br />
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <div className={`invoice-badge status-${invoice.status || "draft"}`}>
                    {(invoice.status || "draft").replace(/_/g, " ")}
                </div>
                <div className={`invoice-badge pay-${invoice.paymentStatus || "unpaid"}`}>
                    {(invoice.paymentStatus || "unpaid").replace(/_/g, " ")}
                </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
                  Linked Quote: {invoice.linkedQuoteId || "—"}
                </div>
              </div>
            </div>

            <div className="meta-grid">
              <div className="meta-box">
                <div className="meta-label">Invoice #</div>
                <div className="meta-value">{invoice.invoiceNumber || "Draft"}</div>
              </div>
              <div className="meta-box">
                <div className="meta-label">Issue Date</div>
                <div className="meta-value">{fmtDate(invoice.createdAt)}</div>
              </div>
              <div className="meta-box">
                <div className="meta-label">Due Date</div>
                <div className="meta-value">{fmtDate(invoice.dueDate)}</div>
              </div>
              <div className="meta-box">
                <div className="meta-label">Project Type</div>
                <div className="meta-value">{invoice.jobType || "—"}</div>
              </div>
            </div>

            <div className="bill-grid">
              <div className="bill-box">
                <div className="section-title-invoice">Bill To</div>
                <div className="bill-name">{invoice.clientName || "Customer name"}</div>
                <div className="bill-text">
                  {invoice.projectAddress || "Project address"}
                </div>
              </div>

              <div className="bill-box">
                <div className="section-title-invoice">From</div>
                <div className="bill-name">{invoice.companyName || "Brushline Services"}</div>
              </div>
            </div>

            <div className="items-wrap">
              <div className="section-title-invoice" style={{ marginBottom: 12 }}>Invoice Items</div>
              <div className="items-head">
                <div>Description</div>
                <div>Qty</div>
                <div>Unit Price</div>
                <div style={{ textAlign: "right" }}>Line Total</div>
                <div></div>
              </div>

              {items.map((item, index) => (
                <div className="item-row" key={item.id || index}>
                  <input
                    className="input"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, { description: e.target.value })}
                    placeholder="Description"
                  />

                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={item.qty}
                    onChange={(e) => updateLineItem(index, { qty: e.target.value })}
                  />

                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, { unitPrice: e.target.value })}
                  />

                  <div className="inline-total">{fmtMoney(item.total)}</div>

                  <button className="remove-btn" type="button" onClick={() => removeLineItem(index)}>
                    Remove
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <button className="btn" type="button" onClick={addLineItem}>+ Add Line Item</button>
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <div className="section-title-invoice">Notes</div>
              <div className="bill-box">
                <div className="bill-text">{invoice.notes || "No notes added yet."}</div>
              </div>
            </div>

            <details className="terms-editor-card" style={{ marginTop: 12 }}>
            <summary className="terms-editor-summary">
                <span className="label" style={{ marginBottom: 0 }}>Invoice Terms</span>
                <span className="terms-editor-toggle">View Terms</span>
            </summary>

            <div style={{ marginTop: 10 }}>
                <textarea
                className="textarea readonly"
                value={invoice.terms || ""}
                readOnly
                />
            </div>
            </details>
          </div>

          <div className="invoice-side">
            <div className="invoice-side-card">
              <div className="section-title-invoice">Invoice Details</div>
              <div className="field-grid">
                <div className="field-row-2">
                  <div className="field">
                    <label className="label">Due Date</label>
                    <input className="input" type="date" value={invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : ""} onChange={(e) => setField("dueDate", e.target.value)} />
                  </div>
                </div>

                <div className="field-row-2">
                  <div className="field">
                    <label className="label">Email</label>
                    <input className="input" value={invoice.email || ""} onChange={(e) => setField("email", e.target.value)} />
                  </div>
                </div>

                <div className="field-row-3">
                  {/* <div className="field">
                    <label className="label">Tax</label>
                    <input className="input" type="number" min="0" step="0.01" value={tax} onChange={(e) => setField("tax", e.target.value)} />
                  </div> */}
                  <div className="field">
                    <label className="label">Deposit Paid</label>
                    <input className="input" type="number" min="0" step="0.01" value={depositPaid} onChange={(e) => setField("depositPaid", e.target.value)} />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Internal Notes</label>
                  <textarea className="textarea" value={invoice.notes || ""} onChange={(e) => setField("notes", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="invoice-side-card" style={{ marginTop: 18 }}>
              <div className="section-title-invoice">Summary</div>
              <div className="summary-box">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{fmtMoney(subtotal)}</strong>
                </div>
                {/* <div className="summary-row">
                  <span>Tax</span>
                  <strong>{fmtMoney(tax)}</strong>
                </div> */}
                <div className="summary-row">
                  <span>Deposit Paid</span>
                  <strong>{fmtMoney(depositPaid)}</strong>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{fmtMoney(grandTotal)}</span>
                </div>
              </div>

              <div className="balance-card">
                <div className="balance-label">Balance Due</div>
                <div className="balance-value">{fmtMoney(balanceDue)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
