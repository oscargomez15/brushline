import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import "../Styling/AssistantModal.css";

const Assistant = lazy(() => import("../Pages/VoiceAssistantTest/VoiceAssistantTest"));

export default function AssistantModal() {
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const launch = event => {
      const link = event.target.closest?.('a[href="/assistant"]');
      if (!link || pathname === "/assistant" || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger.current = link;
      setOpen(true);
    };
    document.addEventListener("click", launch, true);
    return () => document.removeEventListener("click", launch, true);
  }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const modal = dialog.current;
    modal.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      modal.close();
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [open]);
  return <dialog ref={dialog} className="assistant-dialog" aria-label="Brushline project assistant" onCancel={event => { event.preventDefault(); setOpen(false); }}>
    {open && <><div className="assistant-dialog-toolbar"><strong>Brushline Services</strong><button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Close assistant and end call"><X size={22}/></button></div><Suspense fallback={<p className="assistant-dialog-loading" role="status">Loading your project assistant…</p>}><Assistant publicMode /></Suspense></>}
  </dialog>;
}
