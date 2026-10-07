import React, { useId } from "react";
import { createPortal } from "react-dom";
import CrmModal from "./CrmModal";
export default function SendConfirmationModal({ title = "Email sent", message, onClose }) {
  const titleId = useId();
  const messageId = useId();
  return createPortal(<CrmModal onClick={onClose} onDismiss={onClose} label={title}>
    <section className="crm-dialog-card" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}>
      <div className="crm-dialog-icon crm-dialog-icon--success" aria-hidden="true">✓</div>
      <h2 id={titleId}>{title}</h2><p id={messageId}>{message}</p>
      <div className="crm-dialog-actions"><button type="button" className="crm-dialog-primary" onClick={onClose}>Done</button></div>
    </section>
  </CrmModal>, document.body);
}
