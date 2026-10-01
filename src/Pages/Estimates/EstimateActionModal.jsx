import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { getQuoteNumber } from "../../utils/quoteNumber";

export default function EstimateActionModal({ action, onClose, onComplete }) {
  const forwarding = action.type === "forward";
  const quotes = action.quotes || [action.quote];
  const [forwardedIds, setForwardedIds] = useState([]);
  const [failedIds, setFailedIds] = useState([]);
  const [progress, setProgress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  function close() {
    if (busy) return;
    if (forwardedIds.length) onComplete({ sentTo: recipient, forwardedIds });
    else onClose();
  }
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("input")?.focus();
    return () => previous?.focus();
  }, []);
  function onKeyDown(event) {
    if (event.key === "Escape" && !busy) close();
    if (event.key === "Tab") {
      const controls = [...dialog.current.querySelectorAll("input, textarea, button")].filter((element) => !element.disabled);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const token = await netlifyIdentity.currentUser()?.jwt();
      if (!token) throw new Error("Please log in first.");
      if (forwarding) {
        // Send sequentially to respect the email provider's rate limit.
        // Keep successes so retrying a partial failure sends only the remaining estimates.
        const to = recipient || email.trim();
        setRecipient(to);
        const successes = [...forwardedIds];
        const failures = [];
        const remaining = quotes.filter((quote) => !successes.includes(quote.id));
        for (const [index, quote] of remaining.entries()) {
          if (index > 0) await new Promise((resolve) => setTimeout(resolve, 600));
          setProgress(`Sending ${index + 1} of ${remaining.length}…`);
          try {
            const response = await fetch("/.netlify/functions/resend-quote-email", {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ quoteId: quote.id, forwardTo: to }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || "Unable to forward estimate.");
            successes.push(quote.id);
            setForwardedIds([...successes]);
          } catch (failure) { failures.push({ id: quote.id, message: failure.message }); }
        }
        setProgress("");
        setFailedIds(failures.map((failure) => failure.id));
        if (failures.length) {
          setError(`${successes.length} of ${quotes.length} sent. ${failures.length} failed. ${failures[0].message} Retry to send only the failed estimates.`);
          setBusy(false);
        } else {
          onComplete({ sentTo: to, forwardedIds: successes });
        }
        return;
      }
      const response = await fetch("/.netlify/functions/create-change-order", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quoteId: action.quote.id, title, description, price }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to complete this action.");
      onComplete(data);
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={close}>
    <form ref={dialog} className="modal-card fe-action-modal" role="dialog" aria-modal="true" aria-labelledby="estimate-action-title" onKeyDown={onKeyDown} onClick={(event) => event.stopPropagation()} onSubmit={submit}>
      <div className="modal-head">
        <h2 id="estimate-action-title">{forwarding ? `Forward ${quotes.length === 1 ? "estimate" : `${quotes.length} estimates`}` : "Create change order"}</h2>
        <button type="button" className="modal-close" aria-label="Close" disabled={busy} onClick={close}>✕</button>
      </div>
      <div className="modal-body">
        {quotes.length === 1 ? <p>Quote #{getQuoteNumber(quotes[0])} · {quotes[0].clientName}</p> :
          <ul className="fe-forward-list">{quotes.map((quote) => <li key={quote.id}>#{getQuoteNumber(quote)} · {quote.clientName}
            {forwardedIds.includes(quote.id) ? " — Sent" : failedIds.includes(quote.id) ? " — Failed" : ""}</li>)}</ul>}
        {forwarding ? <>
          <p>Each selected estimate is sent as a separate email with its PDF and review link. Customer emails stay the same.</p>
          <label htmlFor="forward-email">Recipient email</label>
          <input id="forward-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy || !!recipient} />
        </> : <>
          <p>The customer will receive a separate change order to sign. The original approved quote stays unchanged. Invoice this addition separately after approval.</p>
          <label htmlFor="change-title">Title</label>
          <input id="change-title" required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} />
          <label htmlFor="change-scope">Added scope of work (include any schedule changes)</label>
          <textarea id="change-scope" required maxLength={10000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} />
          <label htmlFor="change-price">Additional price ($)</label>
          <input id="change-price" type="number" min="0.01" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} disabled={busy} />
        </>}
        {error && <p role="alert" className="error">{error}</p>}
        {progress && <p role="status">{progress}</p>}
        {forwardedIds.length > 0 && error && <p>Already sent estimates will not be resent when you retry.</p>}
        <div className="fe-action-buttons">
          <button type="button" disabled={busy} onClick={close}>{forwardedIds.length ? "Close" : "Cancel"}</button>
          <button type="submit" className="fe-primary-btn" disabled={busy}>{busy ? "Sending…" : forwarding ? failedIds.length ? "Retry failed estimates" : "Forward estimates" : "Create and send for approval"}</button>
        </div>
      </div>
    </form>
  </div>;
}
