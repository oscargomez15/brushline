import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
const labels = { review: "Needs review", verbal: "Verbally approved", declined: "Declined / rejected", paused: "Paused", stopped: "Stopped", firstName: "First name", lastName: "Last name", address: "Address", unit: "Unit", email: "Email", phone: "Phone", notes: "Notes" };
const statuses = { accepted: "Accepted by email provider", failed: "Rejected by email provider", pending: "Attempt recorded — outcome not confirmed", unknown: "Send outcome unknown" };
export default function CustomerActivity({ customer, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [reload, setReload] = useState(0);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    (async () => {
      try {
        const token = await netlifyIdentity.currentUser()?.jwt();
        if (!token) throw new Error("Please log in first.");
        const response = await fetch("/.netlify/functions/get-customer-activity?customerId=" + encodeURIComponent(customer.id), { headers: { Authorization: "Bearer " + token } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load activity.");
        if (active) setItems(data.items || []);
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [customer.id, reload]);
  const visible = items.filter(item => filter === "all" || item.type === filter);
  return <section className="customers-page">
    <button className="customers-secondary-btn" onClick={onBack}>← Back to customers</button>
    <h1 ref={heading} tabIndex={-1}>Customer activity</h1>
    <h2>{customer.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(" ")}</h2>
    <p>History starts when activity tracking is enabled. Provider acceptance does not confirm delivery or that an email was read.</p>
    <label htmlFor="activity-filter">Show </label>
    <select id="activity-filter" value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 10, marginRight: 12 }}>
      <option value="all">All activity</option><option value="email">Emails</option><option value="customer">Customer changes</option><option value="follow_up">Follow-up changes</option>
    </select>
    <button className="customers-secondary-btn" disabled={loading} onClick={() => setReload(n => n + 1)}>Refresh</button>
    {loading ? <p role="status">Loading activity…</p> : error ? <p role="alert" className="customers-error">{error}</p> : <>
      {!visible.length && <p>No recorded activity{filter === "all" ? "" : " in this category"} yet.</p>}
      <ol style={{ listStyle: "none", padding: 0 }}>
        {visible.map(item => <li key={item.id} className="customers-card" style={{ padding: 20, marginTop: 16, overflowWrap: "anywhere" }}>
          <strong>{item.title}</strong><p><time dateTime={item.at}>{new Date(item.at).toLocaleString()}</time> · {item.actor || "System"}</p>
          {item.type === "email" && <><p>{statuses[item.status] || item.status}</p><p><strong>To:</strong> {Array.isArray(item.recipient) ? item.recipient.join(", ") : item.recipient}</p><p><strong>Subject:</strong> {item.subject}</p></>}
          {item.changes?.map((change, index) => <p key={index}><strong>{labels[change.field] || change.field}:</strong> {labels[change.before] || change.before || "(empty)"} → {labels[change.after] || change.after || "(empty)"}</p>)}
          {item.note && <p><strong>Note:</strong> {item.note}</p>}
          {item.documentId && <p>{item.documentType === "invoice" ? "Invoice" : "Quote"}: {item.documentId}</p>}
        </li>)}
      </ol>
    </>}
  </section>;
}
