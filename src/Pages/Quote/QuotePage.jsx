import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../Styling/QuotePage.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

export default function QuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/.netlify/functions/get-quote?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load quote");
        setQuote(data);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  if (err) return <div className="quote-wrap"><div className="quote-card">Error: {err}</div></div>;
  if (!quote) return <div className="quote-wrap"><div className="quote-card">Loading…</div></div>;

  const jobLabel = quote.jobType === "exterior" ? "Exterior Painting" : "Interior Painting";

  return (
    <div className="quote-wrap">
      <div className="quote-shell">

        {/* HEADER in the style you showed (use your quote.css) */}
        <header className="quote-header">
          <div className="quote-header-left">
            <div className="quote-logo">P</div>
            <div>
              <div className="quote-company">{quote.companyName || "Premium Painting"}</div>
              <div className="quote-tagline">Professional Interior & Exterior</div>
            </div>
          </div>

          <div className="quote-header-right">
            <div className="quote-status-pill">AWAITING APPROVAL</div>
            <div className="quote-title">Proposal</div>
          </div>
        </header>

        <section className="quote-meta">
          <div className="quote-meta-item">
            <div className="quote-meta-label">PROPOSAL #</div>
            <div className="quote-meta-value">{quote.quoteNumber || quote.id}</div>
          </div>
          <div className="quote-meta-item">
            <div className="quote-meta-label">DATE</div>
            <div className="quote-meta-value">{new Date(quote.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="quote-meta-item">
            <div className="quote-meta-label">VALID FOR</div>
            <div className="quote-meta-value">{quote.validForDays || 30} Days</div>
          </div>
          <div className="quote-meta-item">
            <div className="quote-meta-label">SERVICE</div>
            <div className="quote-meta-value">{jobLabel}</div>
          </div>
        </section>

        <section className="quote-body">
          <div className="quote-details">
            <div className="quote-detail-card">
              <div className="quote-detail-label">PREPARED FOR</div>
              <div className="quote-detail-value">{quote.clientName || "Client"}</div>
            </div>

            <div className="quote-detail-card">
              <div className="quote-detail-label">PROJECT LOCATION</div>
              <div className="quote-detail-value">{quote.projectAddress || "—"}</div>
            </div>

            <div className="quote-detail-card">
              <div className="quote-detail-label">ESTIMATE TOTAL</div>
              <div className="quote-detail-value quote-total">{fmtMoney(quote.grandTotal)}</div>
            </div>
          </div>

          {quote.note ? (
            <div className="quote-note">
              <div className="quote-note-title">Note</div>
              <div className="quote-note-text">{quote.note}</div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
