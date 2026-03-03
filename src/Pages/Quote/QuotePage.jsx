import React, {useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../Styling/QuotePage.css";
import SignatureCanvas from "react-signature-canvas";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

export default function QuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");

  const [sigOpen, setSigOpen] = useState(false);
  const [typedName, setTypedName] = useState("");
  const sigRef = useRef(null);
  const [approving, setApproving] = useState(false);

  const customerName =
  quote?.clientName ||
  quote?.customer?.fullName ||
  `${quote?.customer?.firstName || ""} ${quote?.customer?.lastName || ""}`.trim();

  const projectAddress =
  quote?.projectAddress ||
  quote?.customer?.address ||
  "";


  const getSessionId = () => {
  const key = "quote_view_session";
  let v = sessionStorage.getItem(key);
  if (!v) {
    v = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, v);
  }
  return v;
};

  const handleApprove = async (signatureDataUrl, typedName) => {
    setApproving(true);
    try {
      const res = await fetch("/.netlify/functions/approve-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          signatureDataUrl,
          typedName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to approve.");

      setQuote((q) => ({
        ...q,
        status: "approved",
        approvedAt: data.approvedAt,
        signature: data.signature,
      }));

      setSigOpen(false);
    } catch (e) {
      alert(e.message);
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

  useEffect(() => {
    if (!id) return;

    fetch("/.netlify/functions/track-quote-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sessionId: getSessionId() }),
    }).catch(() => {});
  }, [id]);

  if (err) return <div className="quote-wrap"><div className="quote-card">Error: {err}</div></div>;
  if (!quote) return <div className="quote-wrap"><div className="quote-card">Loading…</div></div>;

  const jobLabel = quote.jobType === "exterior" ? "Exterior Painting" : "Interior Painting";
  const pkgs = Array.isArray(quote.scopePackages) ? quote.scopePackages : [];
  const currentTotal = Number(quote.grandTotal) || 0;
  const EPS = 0.01;

  // If selectedPackageKey is "custom" (or wrong), infer the current package by matching totals.
  const inferred = pkgs.reduce(
    (best, p) => {
      const t = Number(p.total) || 0;
      const d = Math.abs(t - currentTotal);
      return d < best.diff ? { diff: d, key: p.key } : best;
    },
    { diff: Infinity, key: null }
  );

  const effectiveCurrentKey =
    quote.selectedPackageKey && quote.selectedPackageKey !== "custom"
      ? quote.selectedPackageKey
      : inferred.diff <= EPS
        ? inferred.key
        : quote.selectedPackageKey;

  // ✅ Never show a package card if it results in the same total (prevents identical upgrades)
  let showPkgs = pkgs
    .filter((p) => Math.abs((Number(p.total) || 0) - currentTotal) > EPS)
    .filter((p) => (effectiveCurrentKey ? p.key !== effectiveCurrentKey : true));

  // ✅ If current is FULL, only show downgrades (no upgrades)
  if (effectiveCurrentKey === "full") {
    showPkgs = showPkgs.filter((p) => (Number(p.total) || 0) < currentTotal - EPS);
  }
  return (
    <div className="quote-wrap">
      <div className="quote-shell">

        {/* HEADER in the style you showed (use your quote.css) */}
        <header className="quote-header">
          <div className="quote-header-left">
            <div className="quote-logo">
              <img src="/logo.png" alt="Your Company Logo" />
            </div>
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
                onClick={() => setSigOpen(true)}
                disabled={approving || quote?.status === "approved"}
              >
                {quote?.status === "approved" ? "Approved" : "Approve Estimate"}
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

        <div className="quote-upgrades">
          <div className="quote-upgrades-title">Change Scope</div>
          <div className="quote-upgrades-subtitle">
            Changed your mind? Select a different scope package below to see updated totals and choose the one that’s right for you.
          </div>

          <div className="quote-upgrades-grid">
            {showPkgs.map((p) => {
              const newTotal = Number(p.total) || 0;
              const diff = newTotal - currentTotal;
              const isUp = diff > 0;
              const badge =
                diff === 0 ? "" : isUp ? `+ ${fmtMoney(diff)}` : `- ${fmtMoney(Math.abs(diff))}`;

              return (
                <div key={p.key} className="scope-card">
                  <div className="scope-card-top">
                    <div className="scope-card-title">{p.label}</div>

                    {badge ? (
                      <span className={`scope-badge ${isUp ? "up" : "down"}`}>
                        {badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="scope-card-total">
                    New total <span className="scope-card-total-amt">{fmtMoney(newTotal)}</span>
                  </div>

                  <div className="scope-card-divider" />

                  <div className="scope-card-actions">
                    <button
                      type="button"
                      className="scope-card-btn"
                      onClick={() => handleSelectPackage(p.key)}
                    >
                      Select This Scope
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
      {sigOpen && (
        <div className="sig-backdrop" onClick={() => setSigOpen(false)}>
          <div className="sig-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sign to Approve Estimate</h3>

            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{ className: "sig-canvas" }}
            />

            <input
              type="text"
              placeholder="Type your full name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="sig-input"
            />

            <div className="sig-actions">
              <button
                type="button"
                onClick={() => sigRef.current?.clear()}
                className="btn-secondary"
              >
                Clear
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const pad = sigRef.current;

                  if (!pad) {
                    console.error("Signature pad ref is null");
                    alert("Signature pad not ready. Please refresh and try again.");
                    return;
                  }

                  if (typeof pad.isEmpty !== "function") {
                    console.error("pad.isEmpty is not a function:", pad);
                    alert("Signature pad error. Please refresh and try again.");
                    return;
                  }

                  if (typeof pad.getTrimmedCanvas !== "function") {
                    console.error("pad.getTrimmedCanvas is not a function:", pad);
                    alert("Signature pad error. Please refresh and try again.");
                    return;
                  }

                  if (pad.isEmpty()) {
                    alert("Please sign before submitting.");
                    return;
                  }

                  const name = typedName.trim();
                  if (!name) {
                    alert("Please type your name.");
                    return;
                  }

                  const signatureDataUrl = pad.getTrimmedCanvas().toDataURL("image/png");

                  if (typeof handleApprove !== "function") {
                    console.error("handleApprove is not a function:", handleApprove);
                    alert("Approve handler missing. Please refresh.");
                    return;
                  }

                  handleApprove(signatureDataUrl, name);
                }}
              >
                Submit Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
