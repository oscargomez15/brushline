import CrmModal from "../../Components/CrmModal";
import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";

export default function FollowUpSettings({ quote, onClose, onSaved }) {
  const [state, setState] = useState("review");
  const [note, setNote] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    let active = true;
    const previous = document.activeElement;
    dialog.current?.focus();
    (async () => {
      try {
        const token = await netlifyIdentity.currentUser()?.jwt();
        if (!token) throw new Error("Please log in first.");
        const response = await fetch("/.netlify/functions/quote-follow-up-settings?quoteId=" + encodeURIComponent(quote.id), { headers: { Authorization: "Bearer " + token } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load settings.");
        if (active) { setState(data.settings.state); setNote(data.settings.note || ""); setUpdatedAt(data.settings.updatedAt); setLoading(false); }
      } catch (e) { if (active) setError(e.message); }
    })();
    return () => { active = false; previous?.focus(); };
  }, [quote.id]);
  async function save(event) {
    event.preventDefault();
    if (busy || loading) return;
    setBusy(true); setError("");
    try {
      const token = await netlifyIdentity.currentUser()?.jwt();
      if (!token) throw new Error("Please log in first.");
      const response = await fetch("/.netlify/functions/quote-follow-up-settings", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ quoteId: quote.id, state, note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save settings.");
      onSaved({ ...data.settings, activityRecorded: data.activityRecorded });
    } catch (e) { setError(e.message); setBusy(false); }
  }
  function keyDown(event) {
    if (event.key === "Escape" && !busy) onClose();
    if (event.key === "Tab") {
      const controls = [...dialog.current.querySelectorAll("button, select, textarea")].filter(el => !el.disabled);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  return <CrmModal label="Quote follow-ups" onDismiss={() => { if (!busy) onClose(); }} className="modal-backdrop">
    <form ref={dialog} tabIndex={-1} className="modal-card fe-action-modal" role="dialog" aria-modal="true" aria-labelledby="follow-up-title" onKeyDown={keyDown} onSubmit={save}>
      <div className="modal-head"><h2 id="follow-up-title">Quote follow-ups</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close">×</button></div>
      <div className="modal-body">
        <p>{quote.clientName || "Customer"}</p>
        <p>Email follow-ups are inactive. Verbal approval does not replace the customer's website signature.</p>
        {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
        {loading ? <p>{error ? "Close and reopen to retry loading." : "Loading settings…"}</p> : <>
          <label htmlFor="follow-up-state">Follow-up status</label>
          <select id="follow-up-state" value={state} disabled={busy} onChange={e => setState(e.target.value)} style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 16px" }}>
            <option value="review">Needs review before any follow-up</option>
            <option value="verbal">Verbally approved — stop follow-ups</option>
            <option value="declined">Declined / rejected — no follow-ups</option>
            <option value="paused">Pause follow-ups until I resume</option>
            <option value="stopped">Stop follow-ups</option>
          </select>
          <label htmlFor="follow-up-note">Note (optional)</label>
          <textarea id="follow-up-note" value={note} disabled={busy} onChange={e => setNote(e.target.value)} maxLength={2000} rows={3} placeholder="For example: Approved by phone today" style={{ display: "block", width: "100%", boxSizing: "border-box", margin: "8px 0 16px" }} />
          {updatedAt && <p>Last updated: {new Date(updatedAt).toLocaleString()}</p>}
          <p>To undo a choice, return the status to “Needs review.” This will not send an email.</p>
        </>}
        <button type="button" className="fe-secondary-btn" disabled={busy} onClick={onClose}>Cancel</button>{" "}
        <button type="submit" className="fe-primary-btn" disabled={loading || busy}>{busy ? "Saving…" : "Save follow-up status"}</button>
      </div>
    </form>
  </CrmModal>;
}
