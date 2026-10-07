import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";

const zone = "America/New_York";
const dayLabel = value => new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", month: "short", day: "numeric" }).format(new Date(value));
const timeLabel = value => new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
export default function LiveAppointmentPicker({ bookingToken, onSelect, onCancel }) {
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setSelected("");
    if (!bookingToken) {
      setLoading(false); setError("Online booking is not connected yet. Continue with the assistant to request a visit, or call (239) 777-3713.");
      return () => { active = false; };
    }
    fetch("/.netlify/functions/estimate-availability", { headers: { "X-Booking-Token": bookingToken } }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Availability is unavailable.");
      if (active) { setSlots(data.slots); setDate(data.slots[0]?.date || ""); }
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, bookingToken]);
  const days = [...new Set(slots.map(slot => slot.date))];
  return <div className="voice-modal-backdrop"><section className="voice-consent-modal voice-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="live-appointment-title">
    <button type="button" className="voice-modal-close" onClick={onCancel} aria-label="Close booking calendar"><X /></button>
    <span className="voice-modal-icon"><CalendarClock /></span><h2 id="live-appointment-title">Choose your free estimate</h2><p>45-minute visits. All times are Eastern. Your appointment is booked after you confirm the details with the assistant.</p>
    {loading ? <p role="status">Checking Google Calendar…</p> : error ? <p className="voice-error" role="alert">{error}</p> : !slots.length ? <p>No openings in the next 30 days. Continue with the assistant to request another time.</p> : <>
      <div className="voice-date-cards" aria-label="Available appointment dates">{days.map(day => <button type="button" key={day} className={`voice-date-card ${date === day ? "selected" : ""}`} onClick={() => { setDate(day); setSelected(""); }}>{dayLabel(slots.find(slot => slot.date === day).start)}</button>)}</div>
      <div className="voice-time-section"><span className="voice-time-heading">Available times <strong>Eastern</strong></span><div className="voice-time-slots">{slots.filter(slot => slot.date === date).map(slot => <button type="button" key={slot.start} className={selected === slot.start ? "selected" : ""} onClick={() => setSelected(slot.start)}>{timeLabel(slot.start)}</button>)}</div></div>
      <button type="button" className="voice-consent-button" disabled={!selected} onClick={() => onSelect(slots.find(slot => slot.start === selected))}>Choose this time</button>
    </>}
    <button type="button" className="voice-cancel-button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh availability</button>
    <button type="button" className="voice-cancel-button" onClick={onCancel}>Continue without booking</button>
  </section></div>;
}
