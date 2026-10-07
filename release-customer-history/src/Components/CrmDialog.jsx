import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import CrmModal from "./CrmModal";
let queue = [];
let nextId = 0;
const listeners = new Set();
const emit = () => listeners.forEach(fn => fn());
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const snapshot = () => queue[0] || null;
export function showNotice(message, options = {}) {
  return new Promise(resolve => { queue = [...queue, { id: ++nextId, message: String(message || "Something went wrong. Please try again."), title: "Unable to complete action", tone: "error", ...options, resolve }]; emit(); });
}
export function confirmAction(message, options = {}) {
  return showNotice(message, { title: "Confirm action", tone: "danger", confirm: true, confirmLabel: "Continue", ...options });
}
export default function CrmDialogHost() {
  const entry = useSyncExternalStore(subscribe, snapshot, () => null);
  return entry ? <Dialog key={entry.id} entry={entry} /> : null;
}
function Dialog({ entry }) {
  const [closing, setClosing] = useState(false);
  function finish(value) {
    if (closing) return;
    setClosing(true);
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 140;
    setTimeout(() => { queue = queue.filter(item => item !== entry); entry.resolve(value); emit(); }, delay);
  }
  return createPortal(<CrmModal className={closing ? "crm-dialog-host crm-modal-leaving" : "crm-dialog-host"} onDismiss={() => finish(false)} onClick={() => finish(false)} label={entry.title}>
    <section className="crm-dialog-card" aria-labelledby="crm-dialog-title" aria-describedby="crm-dialog-message">
      <div className={"crm-dialog-icon crm-dialog-icon--" + entry.tone} aria-hidden="true">{entry.tone === "success" ? "✓" : entry.tone === "danger" ? "!" : "i"}</div>
      <h2 id="crm-dialog-title">{entry.title}</h2><p id="crm-dialog-message">{entry.message}</p>
      <div className="crm-dialog-actions">
        {entry.confirm && <button type="button" className="crm-dialog-secondary" disabled={closing} onClick={() => finish(false)}>Cancel</button>}
        <button type="button" className={entry.confirm ? "crm-dialog-danger" : "crm-dialog-primary"} disabled={closing} onClick={() => finish(true)}>{entry.confirm ? entry.confirmLabel : "Done"}</button>
      </div>
    </section>
  </CrmModal>, document.body);
}
