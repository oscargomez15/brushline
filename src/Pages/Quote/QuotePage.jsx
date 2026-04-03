import React, {useRef, useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import "../../Styling/QuotePage.css";
import SignatureCanvas from "react-signature-canvas";
import netlifyIdentity from "netlify-identity-widget";

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

const PAINT_PRODUCTS = {
  promar200: {
    key: "promar200",
    name: "Promar 200",
    pricePerGallon: 31.95,
    image: "/paint-placeholders/promar200.png",
  },
  cashmere: {
    key: "cashmere",
    name: "Cashmere",
    pricePerGallon: 38.95,
    image: "/paint-placeholders/cashmere.png",
  },
  superpaint: {
    key: "superpaint",
    name: "SuperPaint",
    pricePerGallon: 46.95,
    image: "/paint-placeholders/superpaint.png",
  },
  duration: {
    key: "duration",
    name: "Duration",
    pricePerGallon: 57.95,
    image: "/paint-placeholders/duration.png",
  },
  emerald: {
    key: "emerald",
    name: "Emerald",
    pricePerGallon: 65.95,
    image: "/paint-placeholders/emerald.png",
  },
  emerald_rain_refresh: {
    key: "emerald_rain_refresh",
    name: "Emerald Rain Refresh",
    pricePerGallon: 74.45,
    image: "/paint-placeholders/emerald-rain-refresh.png",
  },
};

const ALLOWED_PAINTS_BY_SHEEN = {
  satin: ["superpaint", "emerald"],
  eggshell: ["promar200", "cashmere", "emerald"],
  flat: ["promar200", "cashmere", "emerald"],
};

function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}


function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function QuotePage() {
  const { id } = useParams();
  const query = useQuery();
  const t = query.get("t"); 

  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState("");
  const [prepOpen, setPrepOpen] = useState(true);
  const [sigOpen, setSigOpen] = useState(false);
  const [typedName, setTypedName] = useState("");
  const sigRef = useRef(null);
  const [approving, setApproving] = useState(false);
  const [togglingLineIndex, setTogglingLineIndex] = useState(null);
  const [startingDeposit, setStartingDeposit] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const customerName =
  quote?.clientName ||
  quote?.customer?.fullName ||
  `${quote?.customer?.firstName || ""} ${quote?.customer?.lastName || ""}`.trim();

  const signatureName =
  quote?.signature?.typedName ||
  customerName ||
  "Client";

const signatureUrl =
  quote?.signature?.key
    ? `/.netlify/functions/quote-signature?id=${encodeURIComponent(id)}${t ? `&t=${encodeURIComponent(t)}` : ""}`
    : "";

  const projectAddress =
  quote?.projectAddress ||
  quote?.customer?.address ||
  "";
  
  const handleToggleLineItem = async (lineIndex) => {
    try {
      setTogglingLineIndex(lineIndex);

      const res = await fetch("/.netlify/functions/toggle-quote-line-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          t: t || "",
          lineIndex,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update item");

      setQuote(data.quote);
    } catch (e) {
      alert(e.message);
    } finally {
      setTogglingLineIndex(null);
    }
  };

    const handleStartStripeDeposit = async () => {
    try {
      setStartingDeposit(true);

      const res = await fetch("/.netlify/functions/create-deposit-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, t: t || "" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to start deposit payment");

      if (!data?.url) throw new Error("Missing Stripe checkout URL");

      window.location.href = data.url;
    } catch (e) {
      alert(e.message);
    } finally {
      setStartingDeposit(false);
    }
  };

  const loadQuote = useCallback(async () => {
    const url = new URL("/.netlify/functions/get-quote", window.location.origin);
    url.searchParams.set("id", id);
    if (t) url.searchParams.set("t", t);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load quote");
    setQuote(data?.quote ?? data);
    setErr("");
  }, [id, t]);

  const handleApprove = async (signatureDataUrl, typedName) => {
    setApproving(true);
    try {
      const res = await fetch("/.netlify/functions/approve-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          t: t || "",
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
      setTypedName("");
      sigRef.current?.clear?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setApproving(false);
    }
  };
  
  const handleSelectPackage = async (packageKey) => {
    try {
      const res = await fetch("/.netlify/functions/apply-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, t: t || "", packageKey }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to change scope");
      setQuote(data.quote);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const url = new URL("/.netlify/functions/quote-pdf", window.location.origin);
      url.searchParams.set("id", id);
      url.searchParams.set("ts", Date.now().toString());

      if (t) url.searchParams.set("t", t);

      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      // iPhone / iPad Safari: open PDF directly instead of blob download
      if (isIOS) {
        window.open(url.toString(), "_blank");
        return;
      }

      const headers = {};
      if (!t) {
        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("Please log in to download the PDF.");
        headers.Authorization = `Bearer ${jwt}`;
      }

      const res = await fetch(url.toString(), { headers });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to download PDF (${res.status}): ${text}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Quote-${quote?.quoteNumber || quote?.id || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert(e.message);
    }
  };

    useEffect(() => {
    document.title = "Your Quote from Brushline Services";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadQuote();
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [loadQuote]);

  const depositPaid =
  quote?.depositPaid === true || quote?.depositStatus === "paid";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const deposit = params.get("deposit");
    const sessionId = params.get("session_id");

    if (deposit !== "success") return;
    if (!sessionId || sessionId === "{CHECKOUT_SESSION_ID}") return;
    if (!id) return;
    if (!quote) return;
    if (depositPaid) return;

    const confirmDepositPayment = async () => {
      const res = await fetch("/.netlify/functions/confirm-deposit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          t: t || "",
          sessionId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to confirm deposit payment");
      }

      if (!data?.ok) {
        throw new Error(data?.error || "Deposit payment not confirmed");
      }

      setQuote((prev) => ({
        ...prev,
        ...(data?.quote ?? {}),
        depositPaid: true,
        depositStatus: "paid",
      }));
    };

    (async () => {
      try {
        await confirmDepositPayment();
        await loadQuote();

        params.delete("deposit");
        params.delete("session_id");

        const nextSearch = params.toString();
        const nextUrl =
          window.location.pathname + (nextSearch ? `?${nextSearch}` : "");

        window.history.replaceState({}, "", nextUrl);
      } catch (e) {
        console.error("Deposit confirmation failed:", e);
        setErr(e.message);
      }
    })();
  }, [id, t, quote, depositPaid, loadQuote]);

  useEffect(() => {
      // ✅ no token = admin/internal view = DO NOTHING
      if (!id || !t) return;

      fetch("/.netlify/functions/track-quote-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, t }),
      }).catch((e) => console.error("track-quote-view failed", e));
    }, [id, t]);


  if (err) return <div className="quote-wrap"><div className="quote-card">Error: {err}</div></div>;
  if (!quote) return <div className="quote-wrap"><div className="quote-card">Loading…</div></div>;

const jobLabel =
  quote.jobType === "exterior"
    ? "Exterior Painting"
    : quote.jobType === "handyman"
      ? "Handyman / Misc"
      : "Interior Painting";
  const pkgs = Array.isArray(quote.scopePackages) ? quote.scopePackages : [];

  const pricing = quote?.estimatorData?.pricing || {};
  const wallSheen = pricing.wallSheen || "eggshell";

  const allowedPaintKeys =
    ALLOWED_PAINTS_BY_SHEEN[wallSheen] || ALLOWED_PAINTS_BY_SHEEN.eggshell;

  const currentPaintKey =
    quote?.paintGrade ||
    quote?.materials?.paintGrade ||
    quote?.estimatorData?.paintGrade ||
    "promar200";

  const originalPaintKey =
    quote?.originalPaintGrade ||
    quote?.materials?.originalPaintGrade ||
    quote?.estimatorData?.paintGrade ||
    currentPaintKey;

  const totalGallons =
    Number(quote?.materials?.totalGallons) ||
    Number(quote?.totalGallons) ||
    0;

  const materialsMarkupPct =
    Number(quote?.materials?.materialsMarkupPct) ||
    Number(pricing?.materialsMarkupPct) ||
    0;

  const originalPaintProduct =
    PAINT_PRODUCTS[originalPaintKey] || PAINT_PRODUCTS.promar200;

  const paintOptions = allowedPaintKeys
    .map((key) => PAINT_PRODUCTS[key])
    .filter(Boolean)
    .map((product) => {
      const materialBase = totalGallons * product.pricePerGallon;
      const materialWithMarkup =
        materialBase * (1 + materialsMarkupPct / 100);

      const originalMaterialBase = totalGallons * originalPaintProduct.pricePerGallon;
      const originalMaterialWithMarkup =
        originalMaterialBase * (1 + materialsMarkupPct / 100);

      const diff = materialWithMarkup - originalMaterialWithMarkup;

      return {
        ...product,
        materialBase,
        materialWithMarkup,
        diff,
        isSelected: product.key === currentPaintKey,
      };
    });

  const deposit = Math.round((Number(quote.grandTotal) || 0) * 0.4 * 100) / 100;

  const effectiveCurrentKey =
    quote.selectedPackageKey && quote.selectedPackageKey !== "custom"
      ? quote.selectedPackageKey
      : null;

  // ✅ Never show a package card if it results in the same total (prevents identical upgrades)
    let showPkgs = pkgs;

    // Optional: if you want to hide "custom" if it ever appears
    showPkgs = showPkgs.filter((p) => p.key !== "custom");

    async function handleSelectPaint(productKey) {
      if (!quote) return;
      if (productKey === currentPaintKey) return;

      try {
        const res = await fetch("/.netlify/functions/apply-paint-grade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: quote.id,
            paintGrade: productKey,
            t: t || "",
          }),
        });

        const data = await res.json().catch(() => ({}));

        console.log("apply-paint status:", res.status);
        console.log("apply-paint response:", data);

        if (!res.ok) {
          alert(data?.error || data?.message || "Unable to update paint selection.");
          return;
        }

        setQuote(data.quote || data);
      } catch (e) {
        console.error("apply-paint request failed:", e);
        alert(e.message || "Unable to update paint selection.");
      }
    }

    const closeSignatureModal = () => {
    setSigOpen(false);
    setTypedName("");
    sigRef.current?.clear?.();
  };

  const handleSubmitApproval = () => {
    const pad = sigRef.current;

    if (!pad) {
      alert("Signature pad is not ready yet.");
      return;
    }

    if (typeof pad.isEmpty === "function" && pad.isEmpty()) {
      alert("Please sign before submitting.");
      return;
    }

    if (!typedName.trim()) {
      alert("Please type your name.");
      return;
    }

    let signatureDataUrl = "";

    try {
      if (typeof pad.toDataURL === "function") {
        signatureDataUrl = pad.toDataURL("image/png");
      } else if (typeof pad.getCanvas === "function") {
        signatureDataUrl = pad.getCanvas().toDataURL("image/png");
      } else {
        throw new Error("Unable to capture signature.");
      }
    } catch (e) {
      console.error("Signature export failed:", e, pad);
      alert("Could not capture signature. Please try again.");
      return;
    }

    handleApprove(signatureDataUrl, typedName.trim());
  };

  const baseDeposit =
  quote.depositRequired ||
  Math.round((Number(quote.grandTotal || 0) * 0.4) * 100) / 100;

const stripeFee =
  quote.depositProcessingFee ??
  Math.round(baseDeposit * 0.035 * 100) / 100;

const stripeTotal =
  quote.depositStripeChargeTotal ??
  Math.round((baseDeposit + stripeFee) * 100) / 100;

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
            <button
              type="button"
              className="quote-action-btn"
              onClick={() => window.print()}
              title="Print"
            >
              Print
            </button>

            <button type="button" className="quote-action-btn" onClick={handleDownloadPdf}>
              Download PDF
            </button>

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

          {/* ✅ Handyman / Misc items (line items table) */}
          {quote.jobType === "handyman" &&
          Array.isArray(quote.lineItems) &&
          quote.lineItems.length > 0 && (
            <div className="quote-items">
              <div className="quote-items-title">Service Details</div>

              <div className="quote-items-table">

                {/* HEADER */}
                <div className="quote-items-row head">
                  <div>Service</div>
                  <div className="right">Price</div>
                </div>

                {/* ITEMS */}
                {quote.lineItems.map((item, i) => {
                  const isExcluded = !!item.excluded;

                  return (
                    <div
                      key={i}
                      className={`quote-items-row ${isExcluded ? "is-excluded" : ""}`}
                    >
                      <div className="desc">
                        <span className={isExcluded ? "quote-line-text excluded" : "quote-line-text"}>
                          {item.description}
                        </span>
                      </div>

                      <div
                        className="right"
                        style={{
                          display: "flex",
                          gap: 10,
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        <span className={isExcluded ? "quote-line-price excluded" : ""}>
                          {fmtMoney(item.price)}
                        </span>

                        <button
                          type="button"
                          className={`quote-toggle-line-btn ${isExcluded ? "restore" : ""}`}
                          onClick={() => handleToggleLineItem(i)}
                          disabled={togglingLineIndex === i}
                        >
                          {togglingLineIndex === i
                            ? "Updating..."
                            : isExcluded
                              ? "Restore"
                              : "Exclude"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* TOTAL */}
                <div className="quote-items-row total">
                  <div>Total</div>
                  <div className="right">{fmtMoney(quote.grandTotal)}</div>
                </div>

              </div>
            </div>
          )}

          {Array.isArray(quote.scopeItems) && quote.scopeItems.length > 0 ? (
            <div className="quote-scope">
  
            <div className="quote-scope-title">Scope of Work</div>
            <div className="quote-prep">
              <button
                type="button"
                className={`quote-prep-toggle ${prepOpen ? "is-open" : ""}`}
                onClick={() => setPrepOpen((v) => !v)}
                aria-expanded={prepOpen}
              >
                <div className="quote-prep-toggle-left">
                  <div className="quote-prep-kicker">Included Preparation</div>
                  <div className="quote-prep-title">Surface Preparation</div>
                </div>

                <span className="quote-prep-icon">{prepOpen ? "−" : "+"}</span>
              </button>

              {prepOpen && (
                <div className="quote-prep-body">
                  <div className="quote-prep-grid">
                    {[
                      "Protection of floors, furniture, and surrounding areas (if applicable)",
                      "Filling nail holes, minor dents, and surface imperfections",
                      "Light sanding to ensure proper adhesion",
                      "Application of caulking to gaps, cracks, and joints as needed",
                      "Spot priming repaired or patched areas when necessary",
                      "General surface cleaning prior to painting",
                    ].map((item) => (
                      <div key={item} className="quote-prep-item">
                        <span className="quote-prep-check">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="quote-scope-grid">
              {quote.scopeItems.map((area) => (
                <div key={area.areaId} className="scope-area">
                  <div className="scope-area-head">
                    <div className="scope-area-title">{area.areaName}</div>
                  </div>
                    
                  <div className="scope-section-label">Areas to be painted</div>

                  {/* Paint scope */}
                  <div className="scope-chips">
                    {area.scope.map((item) => (
                      <span key={item} className="scope-chip">
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Extra work */}
                  {Array.isArray(area.extras) && area.extras.length > 0 && (
                    <div className="scope-extras">
                      <div className="scope-extras-title">Additional work</div>

                      <div className="scope-extras-list">
                        {area.extras.map((x, i) => (
                          <div key={`${x.label}-${i}`} className="scope-extra-row">
                            <span className="scope-extra-label">{x.label}</span>
                            <span className="scope-extra-price">{fmtMoney(x.price || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
          ) : null}

          {quote.jobType === "interior" && paintOptions.length > 0 && (
            <div className="paint-section">
              <div className="pkg-head">
                <div className="pkg-title">Choose Your Paint Line</div>
                <div className="pkg-subtitle">
                  Wall sheen selected: <strong>{titleCase(wallSheen)}</strong>
                </div>
              </div>

              <div className="paint-grid">
                {paintOptions.map((product) => (
                  <button
                    key={product.key}
                    type="button"
                    className={`paint-card ${product.isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelectPaint(product.key)}
                  >
                    <div className="paint-card-image-wrap">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="paint-card-image"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.classList.add("is-placeholder");
                        }}
                      />
                      <div className="paint-card-placeholder">Product Image</div>
                    </div>

                    <div className="paint-card-body">
                      <div className="paint-card-name">{product.name}</div>
                      <div className="paint-card-meta">
                        {titleCase(wallSheen)} wall finish
                      </div>
                      <div className="paint-card-price">
                        {fmtMoney(product.pricePerGallon)} / gallon
                      </div>

                      <div className="paint-card-diff">
                        {product.isSelected ? (
                          <span className="paint-selected">Selected</span>
                        ) : product.diff > 0 ? (
                          <span>Upgrade: +{fmtMoney(product.diff)}</span>
                        ) : product.diff < 0 ? (
                          <span>Downgrade: {fmtMoney(Math.abs(product.diff))}</span>
                        ) : (
                          <span>No price change</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {quote.jobType !== "handyman" ? (
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
          </div>
          ) : null}

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

                {quote.status === "approved" && (
                  <button
                    type="button"
                    className={`pkg-approve ${depositPaid ? "paid" : ""}`}
                    onClick={()=> {setPaymentModalOpen(true)}}
                    disabled={startingDeposit || depositPaid}
                  >
                    {depositPaid
                      ? "Deposit Paid ✓"
                      : startingDeposit
                        ? "Opening Checkout..."
                        : `Pay ${fmtMoney(
                            quote.depositRequired ||
                            Math.round((Number(quote.grandTotal || 0) * 0.4) * 100) / 100
                          )} Deposit`}
                  </button>
                )}
              </div>
            </div>

          {quote.note ? (
            <div className="quote-note">
              <div className="quote-note-title">Note</div>
              <div className="quote-note-text">{quote.note}</div>
            </div>
          ) : null}

          {quote.status === "approved" && signatureUrl ? (
            <section className="quote-signature">
              <div className="quote-signature-title">Client Approval</div>

              <div className="quote-signature-card">
                <div className="quote-signature-row">
                  <div className="quote-signature-block">
                    <div className="quote-signature-label">Signed By</div>
                    <div className="quote-signature-value">{signatureName}</div>
                  </div>

                  <div className="quote-signature-block">
                    <div className="quote-signature-label">Date</div>
                    <div className="quote-signature-value">
                      {quote.approvedAt ? new Date(quote.approvedAt).toLocaleString() : "—"}
                    </div>
                  </div>
                </div>

                <div className="quote-signature-image-wrap">
                  <div className="quote-signature-label">Signature</div>
                  <img
                    src={signatureUrl}
                    alt="Client signature"
                    className="quote-signature-image"
                  />
                </div>
              </div>
            </section>
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
      <div className="sig-backdrop" onClick={closeSignatureModal}>
        <div className="sig-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sig-modal-head">
            <h3 className="sig-modal-title">Approve Estimate</h3>
            <p className="sig-modal-subtitle">
              Please sign below and type your full name to confirm approval.
            </p>
          </div>

          <div className="sig-canvas-wrap">
            <div className="sig-canvas-toolbar">
              <div className="sig-canvas-label">Customer Signature</div>
              <div className="sig-canvas-hint">Use your finger or mouse to sign</div>
            </div>

            <SignatureCanvas
              ref={sigRef}
              penColor="#111827"
              clearOnResize={false}
              canvasProps={{ className: "sig-canvas" }}
            />
          </div>

          <div className="sig-form">
            <div className="sig-field">
              <label className="sig-label">Full Name</label>
              <input
                className="sig-input"
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="sig-actions">
            <div className="sig-left-actions">
              <button
                type="button"
                className="sig-btn"
                onClick={() => sigRef.current?.clear()}
              >
                Clear
              </button>
            </div>

            <div className="sig-right-actions">
              <button
                type="button"
                className="sig-btn"
                onClick={closeSignatureModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sig-btn primary"
                disabled={approving || !typedName.trim()}
                onClick={handleSubmitApproval}
              >
                {approving ? "Submitting..." : "Submit Approval"}
              </button>
            </div>
          </div>

          <div className="sig-note">
            By submitting, you confirm approval of the selected quote and its terms.
          </div>
        </div>
      </div>
      )}

          {paymentModalOpen && !depositPaid && (
          <div className="sig-backdrop" onClick={() => setPaymentModalOpen(false)}>
            <div className="sig-modal payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sig-modal-head">
                <h3 className="sig-modal-title">Choose Payment Method</h3>
                <p className="sig-modal-subtitle">
                  Select how you would like to pay your deposit.
                </p>
              </div>

              <div className="payment-methods">
                <div className="payment-card">
                  <div className="payment-card-title">Check</div>
                  <div className="payment-card-text">
                    Mail check payable to <strong>Brushline Services</strong>
                  </div>
                  <div className="payment-card-subtext">
                    3261 Magnolia Pond Dr #104<br />
                    Naples, FL 34116
                  </div>
                </div>

                <div className="payment-card">
                  <div className="payment-card-title">Zelle</div>
                  <div className="payment-card-text">
                    Send payment to:
                  </div>
                  <div className="payment-card-subtext">
                    <strong>239-777-3713</strong>
                  </div>
                </div>

                <div className="payment-card stripe-option">
                  <div className="payment-card-title">Card / Stripe</div>
                  <div className="payment-card-text">
                    Pay securely online by card.
                  </div>
                  <div className="payment-card-subtext">
                    Deposit: {fmtMoney(baseDeposit)}<br />
                    Processing fee: {fmtMoney(stripeFee)}<br />
                    <strong>Total charged: {fmtMoney(stripeTotal)}</strong>
                  </div>

                  <div className="payment-fee-note">
                    Card payments include a 3.5% processing fee.
                  </div>

                  <button
                    type="button"
                    className="sig-btn primary"
                    onClick={handleStartStripeDeposit}
                    disabled={startingDeposit}
                  >
                    {startingDeposit ? "Opening Checkout..." : `Continue to Stripe – ${fmtMoney(stripeTotal)}`}
                  </button>
                </div>
              </div>

              <div className="sig-actions">
                <div className="sig-right-actions">
                  <button
                    type="button"
                    className="sig-btn"
                    onClick={() => setPaymentModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
