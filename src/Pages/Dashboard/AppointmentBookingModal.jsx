import { useState } from 'react';
import netlifyIdentity from 'netlify-identity-widget';
import CrmModal from '../../Components/CrmModal';

export default function AppointmentBookingModal({ slot, onClose, onBooked }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false);
  const [bookingToken, setBookingToken] = useState(null), [submitted, setSubmitted] = useState(null);
  const close = () => { if (!busy) onClose(); };
  const label = new Date(slot.start).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' });
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const lead = submitted || Object.fromEntries(new FormData(event.currentTarget));
    try {
      const token = await netlifyIdentity.currentUser()?.jwt();
      if (!token) throw new Error('Please sign in again.');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      let session = bookingToken;
      if (!session) {
        const response = await fetch('/.netlify/functions/crm-book-appointment', { headers });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not start booking.');
        session = result.bookingToken; setBookingToken(session);
      }
      setSubmitted(lead);
      const response = await fetch('/.netlify/functions/crm-book-appointment', { method: 'POST', headers, body: JSON.stringify({ bookingToken: session, start: slot.start, confirmed: true, lead }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 400 || result.refreshAvailability) setSubmitted(null);
        throw new Error(result.error || 'Could not confirm booking. Retry this appointment.');
      }
      setDone(true); onBooked();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <CrmModal label="Book a free estimate" onDismiss={close} onClick={close}>
    <div className="db-booking-modal">
      <h2>{done ? 'Appointment booked' : 'Book a free estimate'}</h2>
      <p>{label} Eastern · 45 minutes</p>
      {done ? <><p role="status">The appointment is confirmed in Google Calendar. Customer and owner notifications are handled by the booking system.</p><button className="crm-dialog-primary" onClick={close}>Done</button></> : <form onSubmit={submit}>
        <fieldset disabled={busy || Boolean(submitted)}>
          {[['fullName', 'Customer name', 'text'], ['phone', 'Phone', 'tel'], ['email', 'Email', 'email'], ['address', 'Project address (include city)', 'text'], ['service', 'Service requested', 'text']].map(([name, text, type]) => <label key={name}>{text}<input name={name} type={type} required maxLength={1000} /></label>)}
          <label>Project notes<textarea name="projectDetails" rows={3} maxLength={3000} /></label>
        </fieldset>
        <p className="db-card-subtle">Creates a CRM lead, reserves this time in Google Calendar and sends the customer an invitation.</p>
        {error && <p role="alert">{error}</p>}
        <div className="crm-dialog-actions"><button type="button" className="crm-dialog-secondary" disabled={busy} onClick={close}>Close</button><button className="crm-dialog-primary" disabled={busy}>{busy ? 'Confirming…' : submitted ? 'Retry confirmation' : 'Book appointment'}</button></div>
      </form>}
    </div>
  </CrmModal>;
}
