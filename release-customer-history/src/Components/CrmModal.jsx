import React, { useEffect, useRef } from "react";
import "../Styling/CrmModal.css";
const stack = [];
let originalOverflow = "";
const focusable = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]';
export default function CrmModal({ children, className = "", onClick, onMouseDown, onDismiss, label = "Dialog", ...props }) {
  const root = useRef(null);
  const callbacks = useRef({ onClick, onMouseDown, onDismiss });
  callbacks.current = { onClick, onMouseDown, onDismiss };
  useEffect(() => {
    const node = root.current;
    const panel = node.firstElementChild;
    const previous = document.activeElement;
    if (!stack.length) { originalOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    stack.push(node);
    panel.setAttribute("role", panel.getAttribute("role") || "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("tabindex", "-1");
    if (!panel.hasAttribute("aria-labelledby") && !panel.hasAttribute("aria-label")) panel.setAttribute("aria-label", label);
    const controls = () => [...panel.querySelectorAll(focusable)].filter(el => !el.hidden && el.getAttribute("aria-hidden") !== "true");
    (controls()[0] || panel).focus();
    function keydown(event) {
      if (stack[stack.length - 1] !== node) return;
      if (event.key === "Escape") {
        event.preventDefault(); event.stopImmediatePropagation();
        const cb = callbacks.current;
        (cb.onDismiss || cb.onClick || cb.onMouseDown)?.({ target: node, currentTarget: node });
      }
      if (event.key === "Tab") {
        const targets = controls(), first = targets[0], last = targets[targets.length - 1];
        if (!first) { event.preventDefault(); panel.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    function keepFocus(event) {
      if (stack[stack.length - 1] === node && !node.contains(event.target)) (controls()[0] || panel).focus();
    }
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("keydown", keydown, true); document.removeEventListener("focusin", keepFocus);
      stack.splice(stack.indexOf(node), 1);
      if (!stack.length) document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [label]);
  return <div ref={root} {...props} className={"crm-modal-backdrop " + className} onClick={e => { if (e.target === e.currentTarget) onClick?.(e); }} onMouseDown={e => { if (e.target === e.currentTarget) onMouseDown?.(e); }}>{children}</div>;
}
