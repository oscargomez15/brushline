import React, {useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../Styling/QuotePage.css";
import SignatureCanvas from "react-signature-canvas";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

const FEATURES_BY_KEY = {
  walls_only: [
    { label: "Interior Walls", included: true },
    { label: "Ceilings", included: false },
    { label: "Baseboards", included: false },
    { label: "Doors", included: false },
  ],
  walls_ceilings: [
    { label: "Interior Walls", included: true },
    { label: "Ceilings", included: true },
    { label: "Baseboards", included: false },
    { label: "Doors", included: false },
  ],
  full: [
    { label: "Interior Walls", included: true },
    { label: "Ceilings", included: true },
    { label: "Baseboards", included: true },
    { label: "Doors", included: true },
  ],
};

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
    body: JSON.stringify({ id, packageKey }),  });
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

  const deposit = Math.round((Number(quote.grandTotal) || 0) * 0.4 * 100) / 100;

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
    let showPkgs = pkgs;

    // Optional: if you want to hide "custom" if it ever appears
    showPkgs = showPkgs.filter((p) => p.key !== "custom");
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

                    {Array.isArray(area.extras) && area.extras.length > 0 && (
                      <>
                        <div className="quote-scope-line quote-scope-extra-title">Extra work:</div>
                        {area.extras.map((x, i) => (
                          <div key={`${x.label}-${i}`} className="quote-scope-line">
                            • {x.label} {x.price ? `(${fmtMoney(x.price)})` : ""}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="pkg-section">
            <div className="pkg-head">
              <div className="pkg-title">Select Your Package</div>
              <div className="pkg-subtitle">Choose the option that best fits your needs</div>
            </div>

            <div className="pkg-grid">
              {showPkgs.map((p, idx) => {
                const newTotal = Number(p.total) || 0;

                // Decide selection
                const isSelected = (effectiveCurrentKey === p.key);

                // Make the biggest package "recommended" (or use your own rule)
                const hasSelection = !!effectiveCurrentKey;

                const isRecommended =
                  !hasSelection && (
                    p.key === "full" ||
                    /baseboard|doors|trim|full/i.test(p.label)
                  );

                // Normalize into 3 package names you want
                const name =
                  p.key === "walls_only"
                    ? "Walls Only"
                    : p.key === "walls_ceilings"
                      ? "Walls and Ceiling"
                      : "Walls, Ceiling, Baseboard and Doors";

                const features = FEATURES_BY_KEY[p.key] ?? [];

                return (
                  <button
                    key={p.key}
                    type="button"
                    className={`pkg-card ${isSelected ? "is-selected" : ""} ${isRecommended ? "is-recommended" : ""}`}
                    onClick={() => handleSelectPackage(p.key)}
                  >
                    <div className="pkg-radio" aria-hidden="true">
                      <span className="pkg-radio-dot" />
                    </div>

                    {isRecommended ? <div className="pkg-badge">RECOMMENDED</div> : null}

                    <div className="pkg-name">{name}</div>

                    <div className="pkg-price">{fmtMoney(newTotal)}</div>

                    <div className="pkg-features">
                      {features.map((f) => (
                        <div key={f.label} className="pkg-feature">
                          <span className={`pkg-icon ${f.included ? "yes" : "no"}`}>
                            {f.included ? "✓" : "✕"}
                          </span>
                          <span className={`pkg-feature-text ${f.included ? "" : "muted"}`}>
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pkg-cta">
                      {isSelected ? (
                        <span className="pkg-selected">✓ Selected</span>
                      ) : (
                        <span className="pkg-select">Select Package</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pkg-footer">
              <div className="pkg-footer-left">
                <div className="pkg-footer-label">PACKAGE TOTAL</div>
                <div className="pkg-footer-amt">{fmtMoney(quote.grandTotal)}</div>
              </div>

              <div className="pkg-footer-right">
                  <div className="pkg-deposit">
                    <div className="pkg-deposit-top">Start for only</div>
                    <div className="pkg-deposit-amt">{fmtMoney(deposit)} deposit</div>
                  </div>

                  <button
                    type="button"
                    className="pkg-approve"
                    onClick={() => setSigOpen(true)}
                    disabled={approving || quote.status === "approved"}
                  >
                    {quote.status === "approved" ? "Approved" : "Approve"}
                  </button>
              </div>
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

                  const signatureDataUrl = pad.toDataURL("image/png");

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
