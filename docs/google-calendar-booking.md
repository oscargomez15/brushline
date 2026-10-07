# Google Calendar estimate booking

Calendar: **murdexchannel@gmail.com**. Monday–Friday, 9 AM–5 PM America/New_York; 45-minute visits; 30 minutes between visits and other busy events; at least 24 hours notice; next 30 days.

## One-time activation

1. In [Google Cloud Console](https://console.cloud.google.com/), select/create the Brushline project and enable Google Calendar API.
2. Configure Google Auth Platform branding and audience. For initial testing add `murdexchannel@gmail.com` as a test user. Google testing-mode refresh tokens can expire after seven days for these scopes; complete the appropriate production publishing/verification requirements before relying on ongoing bookings.
3. Create an OAuth client with application type **Web application**. Authorized redirect URI: `https://brushlineservices.com/.netlify/functions/google-calendar-callback`.
4. Add server-only Netlify environment variables `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, and `GOOGLE_CALENDAR_ENCRYPTION_KEY`. Generate the encryption key with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`; store it only in Netlify, never in source control or a REACT_APP variable. Existing Netlify Blobs credentials must also be configured. Do not rotate the encryption key without reconnecting Google.
5. Deploy, sign into the CRM as `murdexchannel@gmail.com`, open **Calendar**, and select **Connect Google Calendar**. Authorize that same Google account with all requested permissions.
6. Check the live picker using the assistant. A selected time is provisional until the caller confirms their details. Confirmation creates a real Google event and sends its attendee invitation. Do not confirm test bookings using real client addresses.

For local OAuth testing, set `GOOGLE_CALENDAR_SITE_URL=http://localhost:8888` and register its matching callback URI in Google. Production defaults to `https://brushlineservices.com`.

## Behavior

- Appointment confirmations and booking notifications use `Brushline Services <appointments@brushlineservices.com>` through Resend. Verify `brushlineservices.com` in Resend; the sender does not inherit personal addresses from other email settings. Client replies go to `oscargomez@brushlineservices.com`. Google Calendar invitations still identify the connected Google account as organizer.
- The public picker exposes openings only, never existing calendar event titles or guests.
- Availability fails closed if Google is unreachable. The assistant can still save a preferred-time request for manual confirmation.
- Day-level conditional Blobs leases serialize website bookings. Availability is rechecked immediately before insertion. Busy events made by someone else directly in Google can still race the final check; Calendar API has no atomic “insert only if free” operation.
- Deterministic Google event IDs recover lost responses without creating duplicate events. One assistant session permits one confirmed appointment.
- CRM lead IDs are deterministic for bookings. Calendar confirmation is preserved if CRM storage fails; a retry of the same booking recovers the CRM lead. The private booking record retains recovery details. Existing cancellation/rescheduling is handled by the team on Google Calendar; no public rescheduling interface is implemented yet.
- Owner-only OAuth setup uses expiring, single-use state plus an HttpOnly cookie. Refresh tokens are encrypted at rest. Disconnect revokes the Google grant; existing appointments remain.

References: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [FreeBusy API](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query), [Event insertion](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert).
