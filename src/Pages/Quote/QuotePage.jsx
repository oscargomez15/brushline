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

  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    try {
      setApproving(true);
      const res = await fetch("/.netlify/functions/approve-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quote.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to approve");
      setQuote(data.quote);
    } catch (e) {
      setErr(e.message);
    } finally {
      setApproving(false);
    }
  };
  
  const handleSelectPackage = async (packageKey) => {
  const res = await fetch("/.netlify/functions/apply-package", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: quote.id, packageKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to change scope");
  setQuote(data.quote);
};

  useEffect(() => {
    (async () => {
      try {
      const res = await fetch(`/.netlify/functions/get-quote?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      console.log("get-quote response:", data);
      if (!res.ok) throw new Error(data?.error || "Failed to load quote");

      // ✅ Accept either { ...quoteFields } or { quote: { ...quoteFields } }
      setQuote(data?.quote ?? data);
      console.log("QUOTE FROM get-quote:", data);
      console.log("scopeItems:", data?.scopeItems);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [id]);

  if (err) return <div className="quote-wrap"><div className="quote-card">Error: {err}</div></div>;
  if (!quote) return <div className="quote-wrap"><div className="quote-card">Loading…</div></div>;

  const jobLabel = quote.jobType === "exterior" ? "Exterior Painting" : "Interior Painting";
          const pkgs = Array.isArray(quote.scopePackages) ? quote.scopePackages : [];
          const currentKey = quote.selectedPackageKey;
          const currentTotal = Number(quote.grandTotal) || 0;

          // show all packages except the current one.
          // if current is "custom", show all 3 as options.
          const showPkgs =
            currentKey === "custom" ? pkgs : pkgs.filter((p) => p.key !== currentKey);
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
          <div className="quote-header-actions">
            <div className={`quote-status-pill ${quote.status === "approved" ? "approved" : ""}`}>
              {quote.status === "approved" ? "APPROVED" : "AWAITING APPROVAL"}
            </div>

            {quote.status !== "approved" ? (
              <button
                type="button"
                className="quote-approve-btn"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? "Approving..." : "Approve Estimate"}
              </button>
            ) : null}
          </div>

          <div className="quote-title">Proposal</div>

          {quote.status === "approved" && quote.approvedAt ? (
            <div className="quote-approved-date">
              Approved {new Date(quote.approvedAt).toLocaleString()}
            </div>
          ) : null}
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

              {quote.scopeItems.map((area) => (
                <div key={area.areaId} className="quote-scope-area">
                  <div className="quote-scope-area-name">
                    {area.areaName}
                  </div>

                  <div className="quote-scope-list">
                    {area.scope.map((item) => (
                      <div key={item} className="quote-scope-line">
                        • Paint {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {showPkgs.length > 0 ? (
            <section className="quote-upgrades">
              <div className="quote-upgrades-title">Change Scope</div>

              <div className="quote-upgrades-grid">
                {showPkgs.map((p) => {
                  const newTotal = Number(p.total) || 0;
                  const diff = newTotal - currentTotal;
                  const isUp = diff > 0;

                  return (
                    <div key={p.key} className="quote-upgrade-card">
                      <div className="quote-upgrade-head">
                        <div className="quote-upgrade-name">{p.label}</div>
                        <div className={`quote-upgrade-diff ${isUp ? "up" : "down"}`}>
                          {diff === 0 ? "" : isUp ? `+ ${fmtMoney(diff)}` : `- ${fmtMoney(Math.abs(diff))}`}
                        </div>
                      </div>

                      <div className="quote-upgrade-meta">
                        New total: <strong>{fmtMoney(newTotal)}</strong>
                      </div>

                      <button
                        type="button"
                        className="quote-upgrade-btn"
                        onClick={() => handleSelectPackage(p.key)}
                      >
                        Select This Scope
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {quote.note ? (
            <div className="quote-note">
              <div className="quote-note-title">Note</div>
              <div className="quote-note-text">{quote.note}</div>
            </div>
          ) : null}
        </section>

        {quote.terms ? (
          <section className="quote-terms">
            <div className="quote-terms-title">Terms of Service</div>
            <div className="quote-terms-body">
              {quote.terms.split("\n").map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
