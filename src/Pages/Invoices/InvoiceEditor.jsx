import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";
import { getQuoteNumber } from "../../utils/quoteNumber";
import { getJobTypeLabel } from "../../utils/jobTypeLabel";
import { downloadPdfBlob, fetchPdf } from "../../utils/pdfBrowser";

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
  depositRequired: 0,
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
        title: item.title || "",
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
        description: invoice?.jobType ? `${getJobTypeLabel(invoice.jobType)} service` : "Service",
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
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "zelle",
    note: "",
    paidAt: new Date().toISOString().slice(0, 10),
  });
  
  const handleDownloadPdf = async () => {
  try {
    if (!id) {
      throw new Error("Please save the invoice before downloading the PDF.");
    }

    setDownloadingPdf(true);

    const user = netlifyIdentity.currentUser();
    const jwt = user ? await user.jwt() : null;
    if (!jwt) throw new Error("Please log in first.");

    const blob = await fetchPdf(`/.netlify/functions/get-invoice-pdf?id=${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    downloadPdfBlob(blob, `Invoice-${invoice?.invoiceNumber || id}.pdf`);
  } catch (e) {
    setErr(e.message || "Failed to download PDF");
  } finally {
    setDownloadingPdf(false);
  }
};

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
  const depositRequired =
    Number(invoice.depositRequired) > 0
      ? Number(invoice.depositRequired)
      : Math.round(grandTotal * 0.4 * 100) / 100;
  const downPaymentRemaining = Math.min(
    balanceDue,
    Math.max(0, depositRequired - Math.min(depositPaid, depositRequired))
  );

  const openPaymentModal = () => {
    setErr("");
    setPaymentForm({
      amount: "0",
      method: "zelle",
      note: "",
      paidAt: new Date().toISOString().slice(0, 10),
    });
    setPaymentOpen(true);
  };

  const closePaymentModal = () => {
    if (!recordingPayment) setPaymentOpen(false);
  };

  const handleRecordPayment = async () => {
    try {
      const amount = Number(paymentForm.amount);
      if (!id) throw new Error("Please save the invoice before recording a payment.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a payment amount greater than $0.");
      if (amount > balanceDue) throw new Error(`Payment cannot exceed the ${fmtMoney(balanceDue)} balance.`);

      setRecordingPayment(true);
      setErr("");

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
          invoiceId: id,
          amount,
          method: paymentForm.method,
          note: paymentForm.note,
          paidAt: paymentForm.paidAt
            ? new Date(`${paymentForm.paidAt}T12:00:00`).toISOString()
            : new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to record payment");

      setInvoice((prev) => ({
        ...prev,
        payments: [...(Array.isArray(prev.payments) ? prev.payments : []), data.payment],
        depositPaid: data.depositPaid,
        balanceDue: data.balanceDue,
        paymentStatus: data.paymentStatus,
      }));
      setPaymentOpen(false);
      if (data.emailSent) {
        alert(`Payment recorded and receipt emailed to ${data.emailSentTo}.`);
      } else {
        alert(`Payment recorded. Receipt email was not sent: ${data.emailError || "customer email unavailable"}`);
      }
    } catch (e) {
      setErr(e.message || "Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const setField = (key, value) => {
    setInvoice((prev) => ({ ...prev, [key]: value }));
  };

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

  const updateLineItem = (index, patch) => {
    setInvoice((prev) => {
      const next = [...normalizeItems(prev)];
      const current = next[index] || { description: "", qty: 1, unitPrice: 0, total: 0 };
      const updated = { ...current, ...patch };
      if (Object.prototype.hasOwnProperty.call(patch, "total")) {
        const amount = Number(patch.total) || 0;
        updated.qty = 1;
        updated.unitPrice = amount;
        updated.total = amount;
      } else {
        const qty = Number(updated.qty) || 0;
        const unitPrice = Number(updated.unitPrice) || 0;
        updated.total = qty * unitPrice;
      }
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

const handlePreviewInvoice = () => {
  if (!invoice?.id) return;
  setPreviewOpen(true);
};

const previewUrl = invoice?.id
  ? `/invoice/${encodeURIComponent(invoice.id)}${
      invoice.viewToken ? `?t=${encodeURIComponent(invoice.viewToken)}` : ""
    }`
  : "";

  return (
    <div className="invoice-page">
      <style>{`
        .invoice-page {
          padding: 28px 24px 48px;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
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
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(15,23,42,.045);
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
        .invoice-toolbar-context {
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
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
          grid-template-columns: minmax(0, 1fr) 360px;
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
        .invoice-eyebrow {
          margin-bottom: 6px;
          color: #64748b;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .brand-title {
          font-size: 26px;
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
          grid-template-columns: repeat(2, minmax(0, 1fr));
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
          grid-template-columns: minmax(0, 1fr) 150px 90px;
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
            .invoice-payments {
            margin-top: 16px;
            padding-top: 14px;
            border-top: 1px solid rgba(15, 23, 42, 0.08);
            }

            .invoice-payments.empty {
            margin-top: 16px;
            }

            .invoice-payments-title {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 10px;
            }

            .invoice-payments-list {
            display: grid;
            gap: 10px;
            }

            .invoice-payment-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 12px;
            border: 1px solid rgba(15, 23, 42, 0.08);
            border-radius: 12px;
            background: rgba(15, 23, 42, 0.03);
            }

            .invoice-payment-left {
            min-width: 0;
            }

            .invoice-payment-method {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            }

            .invoice-payment-date {
            margin-top: 2px;
            font-size: 12px;
            color: #64748b;
            }

            .invoice-payment-note {
            margin-top: 6px;
            font-size: 12px;
            line-height: 1.45;
            color: #475569;
            }

            .invoice-payment-right {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
            white-space: nowrap;
            }

            .invoice-summary-card {
            overflow: hidden;
            }

        .invoice-summary-title {
            margin: 0 0 12px;
            font-size: 12px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #64748b;
        }
        .payment-cta {
          margin: 14px 0 4px;
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 13px 16px;
          background: #2563eb;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 99, 235, .2);
        }
        .payment-cta:hover { background: #1d4ed8; }
        .payment-cta:disabled { cursor: not-allowed; opacity: .55; box-shadow: none; }
        .payment-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(15, 23, 42, .55);
          backdrop-filter: blur(3px);
        }
        .payment-dialog {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          width: min(620px, 100%);
          max-height: min(780px, calc(100dvh - 40px));
          overflow: hidden;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 24px 70px rgba(15, 23, 42, .28);
        }
        .payment-dialog-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px 18px;
          border-bottom: 1px solid rgba(15, 23, 42, .08);
        }
        .payment-dialog-head h2 { margin: 0 0 4px; font-size: 22px; color: #0f172a; }
        .payment-dialog-head p { margin: 0; color: #64748b; font-size: 14px; }
        .payment-close { border: 0; background: #f1f5f9; border-radius: 10px; width: 36px; height: 36px; cursor: pointer; font-size: 18px; }
        .payment-dialog-body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 22px 24px 24px; }
        .payment-balance-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px 17px;
          border-radius: 14px;
          background: #eff6ff;
          color: #1e3a8a;
        }
        .payment-balance-summary strong { font-size: 20px; }
        .payment-quick-amounts {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
          padding: 14px 16px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: #f8fbff;
        }
        .payment-quick-amounts-label {
          display: grid;
          gap: 3px;
          color: #334155;
          font-size: 13px;
        }
        .payment-quick-amounts-label strong {
          color: #0f172a;
          font-size: 15px;
        }
        .payment-down-payment-btn {
          flex: 0 0 auto;
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #2563eb;
          border-radius: 10px;
          background: #fff;
          color: #1d4ed8;
          font-weight: 850;
          cursor: pointer;
        }
        .payment-down-payment-btn:hover:not(:disabled) {
          background: #eff6ff;
        }
        .payment-down-payment-btn:disabled {
          cursor: not-allowed;
          opacity: .5;
        }
        .payment-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .payment-field { display: grid; gap: 7px; }
        .payment-field.full { grid-column: 1 / -1; }
        .payment-field label { color: #475569; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
        .payment-field input, .payment-field select, .payment-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
          border-radius: 11px;
          padding: 11px 12px;
          background: #fff;
          color: #0f172a;
          font: inherit;
        }
        .payment-field textarea { min-height: 88px; resize: vertical; }
        .payment-dialog-actions { position: sticky; bottom: -24px; display: flex; justify-content: flex-end; gap: 10px; margin: 22px -24px -24px; padding: 14px 24px calc(16px + env(safe-area-inset-bottom)); border-top: 1px solid #e2e8f0; background: rgba(255,255,255,.96); backdrop-filter: blur(8px); }
        .invoice-preview-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1100;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, .68);
          backdrop-filter: blur(4px);
        }
        .invoice-preview-dialog {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          width: min(1180px, 100%);
          height: min(88vh, 900px);
          overflow: hidden;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 28px 80px rgba(15, 23, 42, .35);
        }
        .invoice-preview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 15px 18px;
          border-bottom: 1px solid #e2e8f0;
          background: #fff;
        }
        .invoice-preview-head h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
        }
        .invoice-preview-head p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 13px;
        }
        .invoice-preview-frame {
          width: 100%;
          height: 100%;
          border: 0;
          background: #f8fafc;
        }
        .invoice-preview-close {
          width: 38px;
          height: 38px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #334155;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }
        @media (max-width: 560px) {
          .payment-backdrop { align-items: end; padding: 8px 8px calc(82px + env(safe-area-inset-bottom)); }
          .payment-dialog { width: 100%; max-height: calc(100dvh - 98px - env(safe-area-inset-bottom)); border-radius: 18px 18px 14px 14px; }
          .payment-dialog-head { padding: 16px 16px 13px; }
          .payment-dialog-head h2 { font-size: 19px; }
          .payment-dialog-body { padding: 16px; }
          .payment-form-grid { grid-template-columns: 1fr; }
          .payment-field.full { grid-column: auto; }
          .payment-dialog-actions { bottom: -16px; flex-direction: column-reverse; margin: 18px -16px -16px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); }
          .payment-dialog-actions button { width: 100%; }
          .payment-quick-amounts { align-items: stretch; flex-direction: column; }
          .payment-down-payment-btn { width: 100%; }
          .invoice-preview-backdrop { padding: 8px; }
          .invoice-preview-dialog { height: 94vh; border-radius: 14px; }
        }
      `}</style>

      <div className="invoice-shell">
        <div className="invoice-toolbar">
          <div className="invoice-toolbar-left">
            <h1>{isEdit ? "Invoice" : "Create Invoice"}</h1>
            <div className="invoice-toolbar-context">
              Manage invoice details, payments, and delivery.
            </div>
          </div>

          <div className="invoice-toolbar-actions">
            <button
            className="btn"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !id}
            >
            {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
            </button>            <button
            className="btn"
            onClick={handlePreviewInvoice}
            disabled={!invoice?.id}
            >
            Preview Invoice
            </button>
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
                <div className="invoice-eyebrow">Invoice Overview</div>
                <h2 className="brand-title">{invoice.invoiceNumber || "Draft Invoice"}</h2>
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
                  Linked Quote: {invoice.linkedQuoteId ? getQuoteNumber({
                    id: invoice.linkedQuoteId,
                    quoteNumber: invoice.quoteNumber,
                    createdAt: invoice.createdAt,
                  }) : "—"}
                </div>
              </div>
            </div>

            <div className="meta-grid">
              <div className="meta-box">
                <div className="meta-label">Due Date</div>
                <div className="meta-value">{fmtDate(invoice.dueDate)}</div>
              </div>
              <div className="meta-box">
                <div className="meta-label">Project Type</div>
                <div className="meta-value">{getJobTypeLabel(invoice.jobType)}</div>
              </div>
            </div>

            <div className="bill-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="bill-box">
                <div className="section-title-invoice">Bill To</div>
                <div className="bill-name">{invoice.clientName || "Customer name"}</div>
                <div className="bill-text">
                  {invoice.projectAddress || "Project address"}
                </div>
              </div>
            </div>

            <div className="items-wrap">
              <div className="section-title-invoice" style={{ marginBottom: 12 }}>Invoice Items</div>
              <div className="items-head">
                <div>Description</div>
                <div style={{ textAlign: "right" }}>Amount</div>
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
                    step="0.01"
                    value={item.total}
                    aria-label={`Amount for item ${index + 1}`}
                    onChange={(e) => updateLineItem(index, { total: e.target.value })}
                  />

                  <button className="remove-btn" type="button" onClick={() => removeLineItem(index)}>
                    Remove
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <button className="btn" type="button" onClick={addLineItem}>+ Add Line Item</button>
              </div>
            </div>

            <details className="terms-editor-card" style={{ marginTop: 12 }}>
            <summary className="terms-editor-summary">
                <span className="label" style={{ marginBottom: 0 }}>Invoice Terms</span>
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
                <div className="field">
                  <label className="label">Due Date</label>
                  <input className="input" type="date" value={invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : ""} onChange={(e) => setField("dueDate", e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">Customer Email</label>
                  <input className="input" type="email" value={invoice.email || ""} onChange={(e) => setField("email", e.target.value)} />
                </div>

                <div className="field">
                  <label className="label">Invoice Notes</label>
                  <textarea className="textarea" value={invoice.notes || ""} onChange={(e) => setField("notes", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="invoice-side-card invoice-summary-card" style={{ marginTop: 18 }}>
            <div className="invoice-summary-title">Summary</div>

            <div className="summary-box">
                {/* <div className="summary-row">
                <span>Subtotal</span>
                <strong>{fmtMoney(subtotal)}</strong>
                </div> */}

                {/* <div className="summary-row">
                <span>Tax</span>
                <strong>{fmtMoney(tax)}</strong>
                </div> */}
{/* 
                <div className="summary-row">
                <span>Payments Received</span>
                <strong>{fmtMoney(depositPaid)}</strong>
                </div> */}

                <div className="summary-row total">
                <span>Total</span>
                <span>{fmtMoney(grandTotal)}</span>
                </div>
                <div className="summary-row">
                <span>Payments Received</span>
                <strong>{fmtMoney(depositPaid)}</strong>
                </div>

                {payments.length > 0 ? (
                <div className="invoice-payments">
                <div className="invoice-payments-title">Payment History</div>

                <div className="invoice-payments-list">
                    {payments
                    .slice()
                    .sort((a, b) => new Date(b.paidAt || b.recordedAt || 0) - new Date(a.paidAt || a.recordedAt || 0))
                    .map((payment) => (
                        <div className="invoice-payment-row" key={payment.id}>
                        <div className="invoice-payment-left">
                            <div className="invoice-payment-method">
                            {prettyMethod(payment.method)}
                            </div>
                            <div className="invoice-payment-date">
                            {fmtDate(payment.paidAt || payment.recordedAt)}
                            </div>
                            {payment.note ? (
                            <div className="invoice-payment-note">{payment.note}</div>
                            ) : null}
                        </div>

                        <div className="invoice-payment-right">
                            {fmtMoney(payment.amount)}
                        </div>
                        </div>
                    ))}
                </div>
                </div>
            ) : (
                <div className="invoice-payments empty">
                <div className="invoice-payments-title">Payment History</div>
                <div className="mini-note">No payments recorded yet.</div>
                </div>
            )}
            </div>

            <div className="balance-card">
                <div className="balance-label">Balance Due</div>
                <div className="balance-value">{fmtMoney(balanceDue)}</div>
            </div>
            <button
              type="button"
              className="payment-cta"
              onClick={openPaymentModal}
              disabled={!id || balanceDue <= 0}
            >
              {balanceDue <= 0 ? "Invoice Paid in Full" : "Record Payment"}
            </button>
            </div>

          </div>
        </div>
        {paymentOpen ? (
          <div className="payment-backdrop" onMouseDown={closePaymentModal}>
            <div className="payment-dialog" role="dialog" aria-modal="true" aria-labelledby="record-payment-title" onMouseDown={(e) => e.stopPropagation()}>
              <div className="payment-dialog-head">
                <div>
                  <h2 id="record-payment-title">Record Payment</h2>
                  <p>{invoice.invoiceNumber || "Invoice"} · {invoice.clientName || "Customer"}</p>
                </div>
                <button type="button" className="payment-close" aria-label="Close" onClick={closePaymentModal}>×</button>
              </div>
              <div className="payment-dialog-body">
                <div className="payment-balance-summary">
                  <span>Current balance</span>
                  <strong>{fmtMoney(balanceDue)}</strong>
                </div>
                <div className="payment-quick-amounts">
                  <div className="payment-quick-amounts-label">
                    <span>
                      {downPaymentRemaining > 0
                        ? "Down payment remaining"
                        : "Remaining invoice balance"}
                    </span>
                    <strong>
                      {fmtMoney(
                        downPaymentRemaining > 0
                          ? downPaymentRemaining
                          : balanceDue
                      )}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="payment-down-payment-btn"
                    onClick={() =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        amount: (
                          downPaymentRemaining > 0
                            ? downPaymentRemaining
                            : balanceDue
                        ).toFixed(2),
                      }))
                    }
                    disabled={balanceDue <= 0}
                  >
                    {downPaymentRemaining > 0
                      ? "Use Down Payment"
                      : "Use Remaining Balance"}
                  </button>
                </div>
                <div className="payment-form-grid">
                  <div className="payment-field">
                    <label htmlFor="payment-amount">Amount</label>
                    <input id="payment-amount" type="number" min="0" max={balanceDue} step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))} autoFocus />
                  </div>
                  <div className="payment-field">
                    <label htmlFor="payment-method">Method</label>
                    <select id="payment-method" value={paymentForm.method} onChange={(e) => setPaymentForm((prev) => ({ ...prev, method: e.target.value }))}>
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
                    <label htmlFor="payment-date">Payment date</label>
                    <input id="payment-date" type="date" value={paymentForm.paidAt} onChange={(e) => setPaymentForm((prev) => ({ ...prev, paidAt: e.target.value }))} />
                  </div>
                  <div className="payment-field full">
                    <label htmlFor="payment-note">Note (optional)</label>
                    <textarea id="payment-note" placeholder="Check number or other payment details" value={paymentForm.note} onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))} />
                  </div>
                </div>
                <div className="payment-dialog-actions">
                  <button type="button" className="btn" onClick={closePaymentModal} disabled={recordingPayment}>Cancel</button>
                  <button type="button" className="btn primary" onClick={handleRecordPayment} disabled={recordingPayment || Number(paymentForm.amount) <= 0}>
                    {recordingPayment ? "Recording…" : `Record ${fmtMoney(paymentForm.amount)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {previewOpen ? (
          <div
            className="invoice-preview-backdrop"
            onMouseDown={() => setPreviewOpen(false)}
          >
            <div
              className="invoice-preview-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="invoice-preview-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="invoice-preview-head">
                <div>
                  <h2 id="invoice-preview-title">Client Invoice Preview</h2>
                  <p>This is the invoice your customer will see.</p>
                </div>
                <button
                  type="button"
                  className="invoice-preview-close"
                  aria-label="Close preview"
                  onClick={() => setPreviewOpen(false)}
                >
                  ×
                </button>
              </div>
              <iframe
                className="invoice-preview-frame"
                src={previewUrl}
                title="Client invoice preview"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
