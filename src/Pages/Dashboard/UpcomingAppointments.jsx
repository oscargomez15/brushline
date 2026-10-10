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
  const [hovered, setHovered] = useState(null);
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
  const availabilityText = key => {
    if (!Array.isArray(data?.slots)) return "Live availability could not be checked. Please refresh.";
    const slots = data.slots.filter(slot => slot.date === key && Date.parse(slot.start) >= Date.now() + 24 * 3600000);
    if (!slots.length) return "No online booking times available. Working hours, existing bookings, travel buffers, and 24 hours’ notice apply.";
    return slots.map(slot => new Date(slot.start).toLocaleTimeString("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" })).join(" · ");
  };
  return <section className="db-card db-appointments-card">
    <div className="db-card-head"><div><div className="db-card-title"><CalendarDays size={20} /> Upcoming appointments</div><div className="db-card-subtle">Next 30 days · Eastern time · Estimates and jobs</div></div><button disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button></div>
    {loading ? <p role="status">Loading appointments…</p> : error ? <p role="alert">{error}</p> : !data?.connected ? <p>Connect Google Calendar to see appointments. <Link to="/crm/settings">Calendar settings →</Link></p> : <>
      <div className="db-availability-legend"><span className="available">Available</span><span className="partial">Half day or more busy</span><span className="full">No availability</span><span className="closed">Closed</span></div>
      <p className="db-availability-note">Workload during 9 AM–5 PM Eastern, including travel buffers. Online estimates require 24 hours’ notice.</p>
      <div className="db-calendar-preview" onMouseLeave={() => setHovered(null)} onKeyDown={event => { if (event.key === "Escape") setHovered(null); }}>
        {hovered && <div id="booking-times-tooltip" role="tooltip" className="db-booking-tooltip"><strong>{hovered} · Available start times</strong><p>{availabilityText(hovered)}</p><small>Eastern time · 45-minute estimates · Refresh for latest availability</small></div>}
        <div className="db-appointment-days" aria-label="Upcoming appointment dates">{dates.map(date => { const key = dayKey(date), count = events.filter(event => onDay(event, key)).length; const availability = data.days?.find(day => day.day === key); return <button key={key} className={`availability-${availability?.status || "unknown"}`} onMouseEnter={() => setHovered(key)} onFocus={() => setHovered(key)} onBlur={() => setHovered(null)} aria-describedby={hovered === key ? "booking-times-tooltip" : undefined} aria-pressed={selected === key} aria-label={`${key}, ${count} appointments${availability ? `, ${availability.label}` : ""}`} onClick={() => setSelected(current => current === key ? null : key)}><small>{date.toLocaleDateString("en-US", { timeZone: zone, weekday: "short", month: "short" })}</small><strong>{date.toLocaleDateString("en-US", { timeZone: zone, day: "numeric" })}</strong><span>{count ? `${count} booked` : availability?.label || "—"}</span></button>; })}</div>
      </div>
      {selected && <div className="db-booking-selected"><strong>Available start times · 45-minute estimates · Eastern time</strong><p>{availabilityText(selected)}</p></div>}
      <div className="db-appointment-list-heading"><strong>{selected || "All upcoming appointments"}</strong>{selected && <button onClick={() => setSelected(null)}>Show all</button>}<a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noreferrer">Schedule a job in Google Calendar ↗</a></div>
      <div className="db-appointment-list">{visible.length ? visible.map(event => <article key={event.id}><div><span className={`db-appointment-type ${event.type}`}>{event.type === "estimate" ? "Free estimate" : event.type === "job" ? "Job" : "Calendar event"}</span><h3>{event.title}</h3><time>{event.allDay ? `${event.start} · All day` : new Date(event.start).toLocaleString("en-US", { timeZone: zone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {duration(event)}</time>{event.location && <p><MapPin size={14} /> {event.location}</p>}</div>{event.url && <a href={event.url} target="_blank" rel="noreferrer">Open ↗</a>}</article>) : <p>No upcoming appointments{selected ? " on this day" : " in the next 30 days"}.</p>}</div>
    </>}
  </section>;
}
