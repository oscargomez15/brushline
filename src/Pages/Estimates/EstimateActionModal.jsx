import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { getQuoteNumber } from "../../utils/quoteNumber";

export default function EstimateActionModal({ action, onClose, onComplete }) {
  const forwarding = action.type === "forward";
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("input")?.focus();
    return () => previous?.focus();
  }, []);
  function onKeyDown(event) {
    if (event.key === "Escape" && !busy) onClose();
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
      const response = await fetch(`/.netlify/functions/${forwarding ? "resend-quote-email" : "create-change-order"}`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(forwarding ? { quoteId: action.quote.id, forwardTo: email.trim() }
          : { quoteId: action.quote.id, title, description, price }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to complete this action.");
      onComplete(data);
    } catch (failure) { setError(failure.message); setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={() => { if (!busy) onClose(); }}>
    <form ref={dialog} className="modal-card fe-action-modal" role="dialog" aria-modal="true" aria-labelledby="estimate-action-title" onKeyDown={onKeyDown} onClick={(event) => event.stopPropagation()} onSubmit={submit}>
      <div className="modal-head">
        <h2 id="estimate-action-title">{forwarding ? "Forward estimate" : "Create change order"}</h2>
        <button type="button" className="modal-close" aria-label="Close" disabled={busy} onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <p>Quote #{getQuoteNumber(action.quote)} · {action.quote.clientName}</p>
        {forwarding ? <>
          <p>Send the estimate PDF and review link to another email. The customer's saved email stays the same.</p>
          <label htmlFor="forward-email">Recipient email</label>
          <input id="forward-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
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
        <div className="fe-action-buttons">
          <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className="fe-primary-btn" disabled={busy}>{busy ? "Sending…" : forwarding ? "Forward estimate" : "Create and send for approval"}</button>
        </div>
      </div>
    </form>
  </div>;
}
