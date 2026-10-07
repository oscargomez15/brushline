import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";
import { Bell, CalendarCheck, CheckCheck, FileCheck2, Users, X } from "lucide-react";
import "../Styling/CRMNotifications.css";

const labels = { all: "All", lead: "Leads", approval: "Approvals", booking: "Bookings" };
export default function CRMNotifications() {
  const [open, setOpen] = useState(false), [items, setItems] = useState([]), [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(""), [filter, setFilter] = useState("all"), [saving, setSaving] = useState(false);
  const boxRef = useRef(null), navigate = useNavigate();
  async function request(method = "GET", ids) {
    const token = await netlifyIdentity.currentUser()?.jwt();
    if (!token) throw new Error("Please sign in to view notifications.");
    const response = await fetch("/.netlify/functions/crm-notifications", { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(ids ? { body: JSON.stringify({ ids }) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Notifications unavailable");
    return result;
  }
  const refresh = useCallback(async () => {
    try { const data = await request(); setItems(data.items); setLoaded(true); setError(""); }
    catch (failure) { setError(failure.message); }
  }, []);
  useEffect(() => {
    let alive = true;
    const update = async () => {
      if (document.visibilityState === "hidden") return;
      try { const data = await request(); if (alive) { setItems(data.items); setLoaded(true); setError(""); } }
      catch (failure) { if (alive) setError(failure.message); }
    };
    update();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    function dismiss(event) { if (!boxRef.current?.contains(event.target)) setOpen(false); }
    function escape(event) { if (event.key === "Escape") { setOpen(false); boxRef.current?.querySelector("button")?.focus(); } }
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  async function markRead(ids) {
    if (!ids.length) return;
    setSaving(true);
    try { await request("POST", ids); setItems(current => current.map(item => ids.includes(item.id) ? { ...item, read: true } : item)); }
    catch (failure) { setError(failure.message); }
    finally { setSaving(false); }
  }
  const unread = items.filter(item => !item.read).length;
  const visible = items.filter(item => filter === "all" || item.type === filter);
  return <div className="crm-notifications" ref={boxRef}>
    <button className="crm-notification-bell" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} aria-controls="crm-notification-panel" onClick={() => { setOpen(value => !value); refresh(); }}><Bell size={21} />{unread > 0 && <span className="crm-notification-count">{unread > 99 ? "99+" : unread}</span>}</button>
    <span className="crm-notification-live" role="status">{loaded ? `${unread} unread CRM notifications` : ""}</span>
    {open && <section id="crm-notification-panel" className="crm-notification-panel" aria-label="CRM notifications">
      <header><div><h2>Notifications</h2><p>{unread ? `${unread} unread updates` : "Recent CRM activity"}</p></div><button aria-label="Close notifications" onClick={() => setOpen(false)}><X size={19} /></button></header>
      <div className="crm-notification-tools"><button disabled={!unread || saving} onClick={() => markRead(items.filter(item => !item.read).map(item => item.id))}><CheckCheck size={16} /> Mark all read</button><button onClick={refresh}>Refresh</button></div>
      <div className="crm-notification-filters" aria-label="Notification categories">{Object.entries(labels).map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>
      {error && <p className="crm-notification-error" role="alert">{error}</p>}
      <div className="crm-notification-list">{!loaded && !error ? <p className="crm-notification-empty">Loading notifications…</p> : visible.length ? visible.map(item => {
        const Icon = item.type === "booking" ? CalendarCheck : item.type === "approval" ? FileCheck2 : Users;
        return <button key={item.id} className={`crm-notification-item ${item.read ? "" : "unread"}`} onClick={async () => { await markRead([item.id]); setOpen(false); navigate(item.href); }}><span className={`crm-notification-icon ${item.type}`}><Icon size={20} /></span><span><strong>{item.title}</strong><span>{item.detail}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} Eastern</time></span>{!item.read && <i aria-label="Unread" />}</button>;
      }) : loaded && <p className="crm-notification-empty">No {filter === "all" ? "notifications" : labels[filter].toLowerCase()} yet.</p>}</div>
    </section>}
  </div>;
}
