import { useEffect, useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { Mail, MapPin, Phone, Search, UserPlus, Trash2 } from "lucide-react";
import CrmModal from "../../Components/CrmModal";
import "./LeadsList.css";
import FindPageSkeleton from "../../Components/FindPageSkeleton";

const fmtDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

export default function LeadsList() {
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLead, setDeleteLead] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");
  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true); setDeleteError("");
    try {
      const token = await netlifyIdentity.currentUser()?.jwt();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/.netlify/functions/delete-lead", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteLead.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete lead.");
      setLeads(current => current.filter(lead => lead.id !== deleteLead.id));
      localStorage.removeItem("brushlineDashboardStats");
      setNotice(`${deleteLead.fullName || "Lead"} deleted.`); setDeleteLead(null);
    } catch (failure) { setDeleteError(failure.message); }
    finally { setDeleting(false); }
  }

  useEffect(() => {
    document.title = "Leads | CRM Brushline";
    (async () => {
      try {
        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("You must be logged in.");
        const response = await fetch("/.netlify/functions/list-leads", { headers: { Authorization: `Bearer ${jwt}` } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load leads.");
        setLeads(data.leads || []);
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => [lead.fullName, lead.phone, lead.email, lead.address, lead.service, lead.projectDetails].join(" ").toLowerCase().includes(q));
  }, [leads, query]);

  if (loading) return <FindPageSkeleton title="Leads" />;
  return <main className="leads-page">
    <header className="leads-header"><div><span>Website inquiries</span><h1>Leads</h1><p>AI assistant conversations and the information collected from prospective clients.</p></div><div className="leads-count"><UserPlus size={20}/><strong>{leads.filter((lead) => lead.status === "new").length}</strong><span>New</span></div></header>
    <label className="leads-search"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, service, or address" /></label>
    {loading && <div className="leads-state">Loading leads…</div>}
    {error && <div className="leads-state error">{error}</div>}
    {notice && <p role="status" className="lead-delete-notice">{notice}</p>}
    {!loading && !error && filtered.length === 0 && <div className="leads-state"><UserPlus size={34}/><strong>No leads found</strong><span>Completed website conversations will appear here.</span></div>}
    <section className="leads-grid">{filtered.map((lead) => <article className="lead-card" key={lead.id}>
      <div className="lead-card-head"><div><span className="lead-source">{lead.source}</span><h2>{lead.fullName}</h2><time>{fmtDate(lead.createdAt)}</time></div><span className={`lead-status ${lead.serviceAreaStatus === "out_of_area" ? "outside" : ""}`}>{lead.serviceAreaStatus === "out_of_area" ? "Outside area" : lead.status}</span></div>
      <div className="lead-service"><strong>{lead.service}</strong>{lead.servicesMentioned?.length > 1 && <span>{lead.servicesMentioned.join(" · ")}</span>}</div>
      <p className="lead-details">{lead.projectDetails || "No project details provided."}</p>
      <div className="lead-contact"><a href={`tel:${lead.phone}`}><Phone/> {lead.phone}</a><a href={`mailto:${lead.email}`}><Mail/> {lead.email}</a><span><MapPin/> {lead.address}</span></div>
      <dl><div><dt>Appointment request</dt><dd>{lead.preferredAppointment || "Not selected"}</dd></div><div><dt>Preferred contact</dt><dd>{lead.preferredContact || "Not provided"}</dd></div>{lead.requestedHuman && <div><dt>Live human</dt><dd>Requested</dd></div>}</dl>
      {lead.transcript?.length > 0 && <details><summary>Conversation transcript</summary>{lead.transcript.map((line, index) => <p key={index}><strong>{line.role === "caller" ? "Caller" : "Assistant"}:</strong> {line.text}</p>)}</details>}
      <button className="lead-delete-button" onClick={() => { setDeleteLead(lead); setDeleteError(""); }} aria-label={`Delete lead ${lead.fullName}`}><Trash2 size={16} /> Delete lead</button>
    </article>)}</section>
    {deleteLead && <CrmModal label="Delete lead" onDismiss={() => { if (!deleting) setDeleteLead(null); }}><section className="lead-delete-dialog"><h2>Delete this lead?</h2><p>Remove {deleteLead.fullName} from your leads and dashboard. Existing appointments, customers, and quotes will remain.</p>{deleteError && <p role="alert">{deleteError}</p>}<div><button disabled={deleting} onClick={() => setDeleteLead(null)}>Cancel</button><button className="lead-delete-confirm" disabled={deleting} onClick={confirmDelete}>{deleting ? "Deleting…" : "Delete lead"}</button></div></section></CrmModal>}
  </main>;
}
