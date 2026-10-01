import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { getQuoteNumber } from "../../utils/quoteNumber";

export default function DeleteEstimatesModal({ quotes, onClose, onDeleted }) {
  const [remaining, setRemaining] = useState(quotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => { const previous = document.activeElement; dialog.current?.querySelector("button")?.focus(); return () => previous?.focus(); }, []);
  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    const deleted = [], failed = [];
    try {
      const token = await netlifyIdentity.currentUser()?.jwt();
      if (!token) throw new Error("Please log in first.");
      for (const quote of remaining) {
        try {
          const response = await fetch(`/.netlify/functions/delete-quote?id=${encodeURIComponent(quote.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || "Unable to delete estimate.");
          deleted.push(quote.id);
        } catch (failure) { failed.push(quote); }
      }
      onDeleted(deleted);
      if (!failed.length) onClose();
      else { setRemaining(failed); setError(`${failed.length} estimate(s) could not be deleted. Retry to delete only those remaining.`); }
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onClick={() => { if (!busy) onClose(); }}>
    <div ref={dialog} className="modal-card fe-action-modal" role="dialog" aria-modal="true" aria-labelledby="delete-estimates-title" onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) onClose();
        if (event.key === "Tab") {
          const controls = [...dialog.current.querySelectorAll("button")].filter((button) => !button.disabled);
          if (!controls.length) { event.preventDefault(); return; }
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }}>
      <div className="modal-head"><h2 id="delete-estimates-title">Delete {remaining.length} estimate(s)?</h2></div>
      <div className="modal-body">
        <p>These estimates will be removed from Find Estimates. Review your selection before continuing.</p>
        <ul className="fe-forward-list">{remaining.map((quote) => <li key={quote.id}>#{getQuoteNumber(quote)} · {quote.clientName}</li>)}</ul>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="fe-action-buttons"><button type="button" className="fe-secondary-btn" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" className="fe-danger-btn" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete estimates"}</button></div>
      </div>
    </div>
  </div>;
}
