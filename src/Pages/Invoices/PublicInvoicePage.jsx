import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

function normalizeItems(invoice) {
  if (Array.isArray(invoice?.lineItems)) {
    return invoice.lineItems.map((item, i) => ({
      id: item.id || `line-${i + 1}`,
      description: item.description || item.name || `Line item ${i + 1}`,
      qty: Number(item.qty ?? item.quantity ?? 1) || 0,
      unitPrice: Number(item.unitPrice ?? item.price ?? 0) || 0,
      total:
        Number(item.total) ||
        (Number(item.qty ?? item.quantity ?? 1) || 0) *
          (Number(item.unitPrice ?? item.price ?? 0) || 0),
    }));
  }

  return [];
}

export default function PublicInvoicePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t") || "";

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
  try {
    if (!id) {
      throw new Error("Missing invoice information.");
    }

    setDownloadingPdf(true);
    setErr("");

    let endpoint = `/.netlify/functions/get-public-invoice-pdf?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
    const options = {};

    if (!token) {
      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;
      if (!jwt) throw new Error("This invoice link is missing its access token.");

      endpoint = `/.netlify/functions/get-invoice-pdf?id=${encodeURIComponent(id)}`;
      options.headers = { Authorization: `Bearer ${jwt}` };
    }

    const res = await fetch(endpoint, options);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to download PDF");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${invoice?.invoiceNumber || id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (e) {
    setErr(e.message || "Failed to download PDF");
  } finally {
    setDownloadingPdf(false);
  }
};

  useEffect(() => {
    document.title = invoice?.invoiceNumber
      ? `Invoice ${invoice.invoiceNumber} | Brushline Services`
      : "Invoice | Brushline Services";
  }, [invoice]);

    const prettyMethod = (method = "") => {
    const map = {
        cash: "Cash",
        check: "Check",
        zelle: "Zelle",
        card: "Card",
        stripe: "Stripe",
        bank_transfer: "Bank Transfer",
        other: "Other",
    };

    return map[method] || method || "Payment";
    };


  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        let endpoint = `/.netlify/functions/get-public-invoice?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
        const options = {};

        if (!token) {
          const user = netlifyIdentity.currentUser();
          const jwt = user ? await user.jwt() : null;
          if (!jwt) throw new Error("This invoice link is missing its access token.");

          endpoint = `/.netlify/functions/get-invoice?id=${encodeURIComponent(id)}`;
          options.headers = { Authorization: `Bearer ${jwt}` };
        }

        const res = await fetch(endpoint, options);

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load invoice");
        }

        setInvoice(data);
      } catch (e) {
        setErr(e.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  const items = useMemo(() => normalizeItems(invoice), [invoice]);

  const subtotal = Number(invoice?.subtotal) || items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const tax = Number(invoice?.tax) || 0;
  const grandTotal = Number(invoice?.grandTotal) || subtotal + tax;
  const depositPaid = Number(invoice?.depositPaid) || 0;
  const balanceDue =
    invoice?.balanceDue !== undefined && invoice?.balanceDue !== null
      ? Number(invoice.balanceDue) || 0
      : Math.max(0, grandTotal - depositPaid);

  if (loading) {
    return (
      <div className="public-invoice-page">
        <style>{styles}</style>
        <div className="public-invoice-shell">
          <div className="public-invoice-state">Loading invoice…</div>
        </div>
      </div>
    );
  }

  if (err || !invoice) {
    return (
      <div className="public-invoice-page">
        <style>{styles}</style>
        <div className="public-invoice-shell">
          <div className="public-invoice-state error">
            {err || "Invoice not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-invoice-page">
      <style>{styles}</style>

      <div className="public-invoice-shell">
        <div className="public-invoice-toolbar no-print">
        <div>
            <div className="toolbar-kicker">Brushline Services</div>
            <h1>Invoice</h1>
            <p>Thank you for your business.</p>
        </div>

        <div className="public-invoice-toolbar-actions">
            <button
            className="download-btn"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            >
            {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
            </button>

            <button className="print-btn" onClick={() => window.print()}>
            Print
            </button>
        </div>
        </div>

        <div className="public-invoice-card">
          <div className="invoice-head">
            <div className="invoice-head-right">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div className={`status-pill pay-${invoice.paymentStatus || "unpaid"}`}>
                        {(invoice.paymentStatus || "unpaid").replace(/_/g, " ")}
                    </div>
                </div>
              <div className="invoice-no">
                Invoice #{invoice.invoiceNumber || invoice.id}
              </div>
            </div>
          </div>

          <div className="meta-grid">
            <div className="meta-card">
              <div className="meta-label">Issue Date</div>
              <div className="meta-value">{fmtDate(invoice.createdAt)}</div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Due Date</div>
              <div className="meta-value">{fmtDate(invoice.dueDate) || "Upon receipt"}</div>
            </div>

            <div className="meta-card">
              <div className="meta-label">Project Type</div>
              <div className="meta-value">{invoice.jobType || "—"}</div>
            </div>
{/* 
            <div className="meta-card">
              <div className="meta-label">Linked Quote</div>
              <div className="meta-value">{invoice.linkedQuoteId ? getQuoteNumber({
                id: invoice.linkedQuoteId,
                quoteNumber: invoice.quoteNumber,
                createdAt: invoice.createdAt,
              }) : "—"}</div>
            </div> */}
          </div>

          <div className="bill-grid">
            <div className="bill-card">
              <div className="section-kicker">Bill To</div>
              <div className="bill-name">{invoice.clientName || "Customer"}</div>
              <div className="bill-text">
                {invoice.projectAddress || "—"}
              </div>
            </div>

            <div className="bill-card">
              <div className="section-kicker">Invoice Summary</div>
              <div className="summary-list">
                <div className="summary-row">
                  <span>Total</span>
                  <strong>{fmtMoney(grandTotal)}</strong>
                </div>
                {/* <div className="summary-row">
                  <span>Tax</span>
                  <strong>{fmtMoney(tax)}</strong>
                </div> */}
                <div className="summary-row">
                  <span>Deposit Paid</span>
                  <strong>{fmtMoney(depositPaid)}</strong>
                </div>
                <div className="summary-row balance">
                  <span>Pending Balance</span>
                  <strong>{fmtMoney(balanceDue)}</strong>
                </div>
              </div>

              {payments.length > 0 ? (
                <div className="payment-history">
                    <div className="payment-history-title">Payments Made</div>

                    <div className="payment-history-list">
                    {payments.map((payment) => (
                        <div className="payment-history-row" key={payment.id}>
                        <div className="payment-history-left">
                            <div className="payment-history-method">
                            {prettyMethod(payment.method)}
                            </div>
                            <div className="payment-history-date">
                            {fmtDate(payment.paidAt)}
                            </div>
                        </div>

                        <div className="payment-history-right">
                            {fmtMoney(payment.amount)}
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                ) : null}
            </div>
          </div>

          <div className="items-section">
            <div className="section-title">Invoice Items</div>

            <div className="items-table">
              <div className="items-head">
                <div>Description</div>
                <div className="center">Qty</div>
                <div className="right">Unit Price</div>
                <div className="right">Line Total</div>
              </div>

              {items.length === 0 ? (
                <div className="items-empty">No line items found.</div>
              ) : (
                items.map((item) => (
                  <div className="items-row" key={item.id}>
                    <div className="item-desc">
                      <div className="mobile-label">Description</div>
                      {item.description || "—"}
                    </div>
                    <div className="center">
                      <div className="mobile-label">Qty</div>
                      {item.qty}
                    </div>
                    <div className="right">
                      <div className="mobile-label">Unit Price</div>
                      {fmtMoney(item.unitPrice)}
                    </div>
                    <div className="right strong">
                      <div className="mobile-label">Line Total</div>
                      {fmtMoney(item.total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="notes-grid">
            <div className="note-card">
              <div className="section-kicker">Notes</div>
              <div className="note-text">
                {invoice.notes || "No additional notes."}
              </div>
            </div>

            <details className="note-card terms-card">
            <summary className="terms-summary">
            <span className="section-kicker">Terms & Payment Info</span>
            <span className="terms-toggle" />
            </summary>

            <div className="note-text terms-text">
                {invoice.terms || "Payment due upon receipt."}
            </div>
            </details>
          </div>

          <div className="footer-note">
            Questions about this invoice? Reply to the email you received and we’ll be happy to help.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .public-invoice-page {
    min-height: 100vh;
    background: #f4f6f8;
    padding: 140px 16px 32px;
  }

  .public-invoice-shell {
    max-width: 1020px;
    margin: 0 auto;
  }

  .public-invoice-toolbar {
    margin-bottom: 16px;
    padding: 18px 20px;
    border: 1px solid rgba(15,23,42,.08);
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 10px 28px rgba(15,23,42,.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .toolbar-kicker {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
  }

  .public-invoice-toolbar h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    color: #0f172a;
  }

  .public-invoice-toolbar p {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 14px;
  }

  .print-btn {
    height: 44px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid rgba(15,23,42,.12);
    background: #0f172a;
    color: #fff;
    font-weight: 900;
    cursor: pointer;
    white-space: nowrap;
  }

  .public-invoice-card,
  .public-invoice-state {
    background: #fff;
    border: 1px solid rgba(15,23,42,.08);
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(15,23,42,.06);
  }

  .public-invoice-card {
    padding: 28px;
  }

  .public-invoice-state {
    padding: 24px;
    font-weight: 700;
    color: #0f172a;
  }

  .public-invoice-state.error {
    color: #b91c1c;
    border-color: rgba(239,68,68,.15);
  }

  .invoice-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(15,23,42,.08);
  }

  .company-name {
    font-size: 30px;
    font-weight: 950;
    letter-spacing: -.03em;
    color: #0f172a;
  }

  .company-sub {
    font-size: 14px;
    line-height: 1.6;
    color: #475569;
  }

  .invoice-head-right {
    text-align: right;
  }

  .status-pill {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid rgba(15,23,42,.08);
    background: #f8fafc;
    color: #0f172a;
    font-size: 12px;
    font-weight: 900;
    text-transform: capitalize;
  }

  .status-pill.paid {
    background: rgba(34,197,94,.12);
    color: #166534;
    border-color: rgba(34,197,94,.18);
  }

  .status-pill.partial {
    background: rgba(245,158,11,.14);
    color: #92400e;
    border-color: rgba(245,158,11,.2);
  }

  .status-pill.unpaid,
  .status-pill.draft,
  .status-pill.sent {
    background: rgba(15,23,42,.05);
    color: #334155;
  }

  .invoice-no {
    margin-top: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #475569;
  }

  .meta-grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .meta-card,
  .bill-card,
  .note-card {
    border: 1px solid rgba(15,23,42,.08);
    border-radius: 14px;
    background: #fff;
    padding: 16px;
  }

  .meta-card {
    background: #fafafa;
  }

  .meta-label,
  .section-kicker {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #64748b;
  }

  .meta-value {
    margin-top: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    word-break: break-word;
  }

  .bill-grid,
  .notes-grid {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .bill-name {
    margin-top: 10px;
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .bill-text,
  .note-text {
    margin-top: 8px;
    white-space: pre-line;
    font-size: 14px;
    line-height: 1.6;
    color: #475569;
  }

  .summary-list {
    margin-top: 10px;
    display: grid;
    gap: 10px;
  }

  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    color: #334155;
  }

  .summary-row.total {
    padding-top: 10px;
    border-top: 1px solid rgba(15,23,42,.08);
    font-size: 17px;
    font-weight: 900;
    color: #0f172a;
  }

  .summary-row.balance {
    margin-top: 4px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #0f172a;
    color: #fff;
    font-weight: 900;
  }

  .summary-row.balance span,
  .summary-row.balance strong {
    color: #fff !important;
  }

  .items-section {
    margin-top: 22px;
  }

  .section-title {
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .items-table {
    border: 1px solid rgba(15,23,42,.08);
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
  }

  .items-head,
  .items-row {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) 90px 140px 140px;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
  }

  .items-head {
    background: rgba(15,23,42,.04);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #64748b;
  }

  .items-row {
    border-top: 1px solid rgba(15,23,42,.08);
    font-size: 14px;
    color: #0f172a;
  }

  .items-empty {
    padding: 18px 16px;
    color: #64748b;
    font-size: 14px;
  }

  .strong {
    font-weight: 900;
  }

  .center {
    text-align: center;
  }

  .right {
    text-align: right;
  }

  .footer-note {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(15,23,42,.08);
    font-size: 13px;
    line-height: 1.6;
    color: #64748b;
  }

  .mobile-label {
    display: none;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #64748b;
  }

  @media (max-width: 900px) {
    .meta-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .bill-grid,
    .notes-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .public-invoice-toolbar-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    }

    .public-invoice-toolbar-actions button {
    width: 100%;
}

    .payment-history-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .payment-history-right {
        white-space: normal;
    }
    .public-invoice-page {
      padding: 124px 12px 20px;
    }

    .public-invoice-toolbar {
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
    }

    .public-invoice-card {
      padding: 16px;
    }

    .invoice-head {
      flex-direction: column;
    }

    .invoice-head-right {
      text-align: left;
    }

    .meta-grid {
      grid-template-columns: 1fr;
    }

    .items-head {
      display: none;
    }

    .items-row {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .center,
    .right {
      text-align: left;
    }

    .mobile-label {
      display: block;
    }
  }

  @media print {
    body {
      background: #fff !important;
    }

    .public-invoice-page {
      padding: 0 !important;
      background: #fff !important;
    }

    .public-invoice-shell {
      max-width: 100% !important;
    }

    .public-invoice-card {
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
    }

    .no-print {
      display: none !important;
    }
  }

    .status-pill.status-draft {
    background: rgba(15,23,42,.05);
    color: #334155;
        }

    .status-pill.status-sent {
    background: rgba(37,99,235,.12);
    color: #1d4ed8;
    border-color: rgba(37,99,235,.18);
    }

    .status-pill.status-void {
    background: rgba(239,68,68,.12);
    color: #991b1b;
    border-color: rgba(239,68,68,.18);
    }

    .status-pill.pay-paid {
    background: rgba(34,197,94,.12);
    color: #166534;
    border-color: rgba(34,197,94,.18);
    }

    .status-pill.pay-partial {
    background: rgba(245,158,11,.12);
    color: #92400e;
    border-color: rgba(245,158,11,.18);
    }

    .status-pill.pay-unpaid {
    background: rgba(15,23,42,.05);
    color: #334155;
    }

    .terms-card {
    padding: 0;
    overflow: hidden;
    }

    .terms-summary {
    list-style: none;
    cursor: pointer;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    }

    .terms-summary::-webkit-details-marker {
    display: none;
    }

    .terms-toggle {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    background: rgba(15,23,42,.06);
    border: 1px solid rgba(15,23,42,.08);
    border-radius: 999px;
    padding: 6px 10px;
    }

    .terms-card[open] .terms-toggle::after {
    content: " Less";
    }

    .terms-card:not([open]) .terms-toggle::after {
    content: " Terms";
    }

    .terms-text {
    padding: 0 16px 16px;
    border-top: 1px solid rgba(15,23,42,.08);
    }

    .payment-history {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(15,23,42,.08);
    }

    .payment-history-title {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 10px;
    }

    .payment-history-list {
    display: grid;
    gap: 10px;
    }

    .payment-history-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(15,23,42,.08);
    border-radius: 12px;
    background: rgba(15,23,42,.03);
    }

    .payment-history-left {
    min-width: 0;
    }

    .payment-history-method {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    }

    .payment-history-date {
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
    }

    .payment-history-right {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
    white-space: nowrap;
    }

    .public-invoice-toolbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    }

    .download-btn {
    height: 44px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid rgba(15,23,42,.12);
    background: #fff;
    color: #0f172a;
    font-weight: 900;
    cursor: pointer;
    white-space: nowrap;
    }

    .download-btn:disabled,
    .print-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    }
`;
