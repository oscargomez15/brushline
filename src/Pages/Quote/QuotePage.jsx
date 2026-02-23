import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../Styling/QuotePage.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

export default function QuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");

  const customerName =
  quote?.clientName ||
  quote?.customer?.fullName ||
  `${quote?.customer?.firstName || ""} ${quote?.customer?.lastName || ""}`.trim();

  const projectAddress =
  quote?.projectAddress ||
  quote?.customer?.address ||
  "";

  useEffect(() => {
    (async () => {
      try {
      const res = await fetch(`/.netlify/functions/get-quote?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      console.log("get-quote response:", data);
      if (!res.ok) throw new Error(data?.error || "Failed to load quote");

      // ✅ Accept either { ...quoteFields } or { quote: { ...quoteFields } }
      setQuote(data?.quote ?? data);
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
              <div className="quote-company">{quote.companyName}</div>
              <div className="quote-tagline">Painting and Home Improvement</div>
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
              <div className="quote-detail-value">{customerName}</div>
            </div>

            <div className="quote-detail-card">
              <div className="quote-detail-label">PROJECT LOCATION</div>
              <div className="quote-detail-value">{projectAddress}</div>
            </div>

            <div className="quote-detail-card">
              <div className="quote-detail-label">ESTIMATE TOTAL</div>
              <div className="quote-detail-value quote-total">{fmtMoney(quote.grandTotal)}</div>
            </div>
          </div>

          {Array.isArray(quote.scopeItems) && quote.scopeItems.length > 0 ? (
            <div className="quote-scope">
              <div className="quote-scope-title">Scope of Work</div>

              {quote.scopeItems.map((a) => (
                <div key={a.areaId} className="quote-scope-area">
                  <div className="quote-scope-area-name">{a.areaName}</div>

                  <div className="quote-scope-tags">
                    {(a.scope || []).map((tag) => (
                      <span key={tag} className="quote-scope-tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {a.notes ? <div className="quote-scope-notes">{a.notes}</div> : null}
                </div>
              ))}
            </div>
          ) : null}

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
