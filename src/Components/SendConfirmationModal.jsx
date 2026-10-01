import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "../Styling/SendConfirmationModal.css";

export default function SendConfirmationModal({ title = "Email sent", message, onClose }) {
  const titleId = useId();
  const messageId = useId();
  const button = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    button.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return createPortal(
    <div className="send-confirmation-backdrop" onClick={onClose}>
      <div className="send-confirmation-card" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}
        onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "Tab") { event.preventDefault(); button.current?.focus(); }
        }}>
        <div className="send-confirmation-art" aria-hidden="true">
          <span className="send-confirmation-ring" />
          <svg viewBox="0 0 80 80" className="send-confirmation-check"><circle cx="40" cy="40" r="34" /><path d="M24 40l11 11 22-24" /></svg>
          <span className="send-confirmation-spark spark-one" /><span className="send-confirmation-spark spark-two" /><span className="send-confirmation-spark spark-three" />
        </div>
        <span className="send-confirmation-eyebrow">Sent successfully</span>
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>
        <button ref={button} type="button" onClick={onClose}>Done</button>
      </div>
    </div>, document.body
  );
}
