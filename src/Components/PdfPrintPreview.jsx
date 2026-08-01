import React, { useEffect, useRef } from "react";
import "../Styling/PdfPrintPreview.css";

export default function PdfPrintPreview({ open, url, title, onClose }) {
  const frameRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const printPdf = () => {
    try {
      frameRef.current?.contentWindow?.focus();
      frameRef.current?.contentWindow?.print();
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="pdf-preview-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="pdf-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-preview-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="pdf-preview-header">
          <div>
            <span className="pdf-preview-kicker">Print preview</span>
            <h2 id="pdf-preview-title">{title}</h2>
          </div>
          <button type="button" className="pdf-preview-close" onClick={onClose} aria-label="Close print preview">
            &times;
          </button>
        </header>
        <div className="pdf-preview-frame-wrap">
          <iframe ref={frameRef} src={url} title={`${title} print preview`} />
        </div>
        <footer className="pdf-preview-actions">
          <button type="button" className="pdf-preview-secondary" onClick={onClose}>Close</button>
          <button type="button" className="pdf-preview-primary" onClick={printPdf}>Print</button>
        </footer>
      </section>
    </div>
  );
}
