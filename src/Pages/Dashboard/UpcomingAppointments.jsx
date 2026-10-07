import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";
import { CalendarDays, MapPin } from "lucide-react";
const zone = "America/New_York";
const dayKey = date => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const eventDay = event => event.allDay ? event.start : dayKey(new Date(event.start));
const onDay = (event, key) => {
  const start = eventDay(event);
  if (!event.end) return start === key;
  const end = event.allDay ? event.end : dayKey(new Date(Date.parse(event.end) - 1));
  return key >= start && (event.allDay ? key < end : key <= end);
};
const duration = event => {
  if (event.allDay) return "All day";
  if (!event.end || !event.start) return "Duration not set";
  const minutes = Math.max(0, Math.round((Date.parse(event.end) - Date.parse(event.start)) / 60000));
  if (!Number.isFinite(minutes) || minutes === 0) return "Duration not set";
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : `${minutes}m`;
};
export default function UpcomingAppointments() {
  const [data, setData] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(true), [refresh, setRefresh] = useState(0), [selected, setSelected] = useState(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    (async () => {
      try {
        const token = await netlifyIdentity.currentUser()?.jwt();
        if (!token) throw new Error("Please sign in to see appointments.");
        const response = await fetch("/.netlify/functions/dashboard-appointments", { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Calendar unavailable.");
        if (active) setData(result);
      } catch (failure) { if (active) setError(failure.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [refresh]);
  const dates = Array.from({ length: 30 }, (_, index) => { const date = new Date(); date.setUTCDate(date.getUTCDate() + index); return date; });
  const events = data?.appointments || [];
  const visible = selected ? events.filter(event => onDay(event, selected)) : events;
  return <section className="db-card db-appointments-card">
    <div className="db-card-head"><div><div className="db-card-title"><CalendarDays size={20} /> Upcoming appointments</div><div className="db-card-subtle">Next 30 days · Eastern time · Estimates and jobs</div></div><button disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
    {loading ? <p role="status">Loading appointments…</p> : error ? <p role="alert">{error}</p> : !data?.connected ? <p>Connect Google Calendar to see appointments. <Link to="/crm/calendar">Calendar settings →</Link></p> : <>
      <div className="db-appointment-days" aria-label="Upcoming appointment dates">{dates.map(date => { const key = dayKey(date), count = events.filter(event => onDay(event, key)).length; return <button key={key} aria-pressed={selected === key} aria-label={`${key}, ${count} appointments`} onClick={() => setSelected(current => current === key ? null : key)}><small>{date.toLocaleDateString("en-US", { timeZone: zone, weekday: "short", month: "short" })}</small><strong>{date.toLocaleDateString("en-US", { timeZone: zone, day: "numeric" })}</strong><span>{count ? `${count} booked` : "—"}</span></button>; })}</div>
      <div className="db-appointment-list-heading"><strong>{selected || "All upcoming appointments"}</strong>{selected && <button onClick={() => setSelected(null)}>Show all</button>}<a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noreferrer">Schedule a job in Google Calendar ↗</a></div>
      <div className="db-appointment-list">{visible.length ? visible.map(event => <article key={event.id}><div><span className={`db-appointment-type ${event.type}`}>{event.type === "estimate" ? "Free estimate" : event.type === "job" ? "Job" : "Calendar event"}</span><h3>{event.title}</h3><time>{event.allDay ? `${event.start} · All day` : new Date(event.start).toLocaleString("en-US", { timeZone: zone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {duration(event)}</time>{event.location && <p><MapPin size={14} /> {event.location}</p>}</div>{event.url && <a href={event.url} target="_blank" rel="noreferrer">Open ↗</a>}</article>) : <p>No upcoming appointments{selected ? " on this day" : " in the next 30 days"}.</p>}</div>
    </>}
  </section>;
}
