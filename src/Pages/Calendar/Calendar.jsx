import { useEffect, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { CalendarDays, CheckCircle2, Link2 } from "lucide-react";
import "./Calendar.css";

export default function Calendar() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function request(method = "GET", action) {
    const token = await netlifyIdentity.currentUser()?.jwt();
    if (!token) throw new Error("Please sign in first.");
    const response = await fetch("/.netlify/functions/google-calendar-connection", { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(action ? { body: JSON.stringify({ action }) } : {}) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Calendar unavailable");
    return result;
  }
  useEffect(() => {
    let active = true;
    request().then(result => { if (active) setData(result); }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);
  async function connect() {
    setBusy(true); setError("");
    try { const result = await request("POST", "connect"); window.location.assign(result.url); }
    catch (failure) { setError(failure.message); setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError("");
    try { await request("POST", "disconnect"); setData(await request()); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  const callback = new URLSearchParams(window.location.search).get("connection");
  return <div className="calendar-page">
    <header><span className="calendar-eyebrow">BRUSHLINE CRM</span><h1><CalendarDays /> Estimate calendar</h1><p>Let clients choose a real opening while speaking with your AI assistant.</p></header>
    {error && <p className="calendar-error" role="alert">{error}</p>}
    {callback && <p className={callback === "connected" ? "calendar-success" : "calendar-error"} role="status">{callback === "connected" ? "Google Calendar connected successfully." : callback === "wrong_account" ? "Choose murdexchannel@gmail.com when connecting Google." : "Connection was not completed. Please try again and grant the requested calendar permissions."}</p>}
    <div className="calendar-grid"><section className="calendar-panel">
      <span className="calendar-status">{data?.connected ? <CheckCircle2 /> : <Link2 />}{data?.connected ? "Connected" : "Connection needed"}</span>
      <h2>Google Calendar</h2><p><strong>murdexchannel@gmail.com</strong></p>
      <p>Bookings appear on this calendar with the client’s name, project address, phone, and service details. Google sends the client a calendar invitation.</p>
      <button disabled={busy || !data?.configured} onClick={connect}>{busy ? "Please wait…" : data?.connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}</button>
      {data?.connected && <details><summary>Disconnect calendar</summary><p>This stops new online bookings. Existing appointments remain on Google Calendar.</p><button className="calendar-secondary" disabled={busy} onClick={disconnect}>Disconnect and revoke access</button></details>}
    </section><section className="calendar-panel"><h2>Free estimate settings</h2><dl><div><dt>Days</dt><dd>Monday–Friday</dd></div><div><dt>Hours</dt><dd>9 AM–5 PM Eastern</dd></div><div><dt>Visit</dt><dd>45 minutes</dd></div><div><dt>Travel buffer</dt><dd>30 minutes between visits</dd></div><div><dt>Advance notice</dt><dd>At least 24 hours</dd></div><div><dt>Booking window</dt><dd>Next 30 days</dd></div></dl><p>Busy calendar events block appointments. Times follow Eastern daylight saving changes automatically.</p></section></div>
    {data && !data.configured && <section className="calendar-panel calendar-setup"><h2>One-time Google setup</h2><p>Create a Google Cloud Web application OAuth client with the Calendar API enabled. Add these server-only environment variables to Netlify:</p><ul><li><code>GOOGLE_CALENDAR_CLIENT_ID</code></li><li><code>GOOGLE_CALENDAR_CLIENT_SECRET</code></li><li><code>GOOGLE_CALENDAR_ENCRYPTION_KEY</code> — a random 32-byte key encoded as 64 hex characters</li></ul><p>Authorized redirect URI:</p><code className="calendar-uri">https://brushlineservices.com/.netlify/functions/google-calendar-callback</code><p>Then redeploy and return here to connect your account. Clients do not authorize Google access themselves.</p></section>}
  </div>;
}
