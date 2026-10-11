const calendar = require('./_google-calendar');
const booking = require('./book-estimate-appointment');

exports.handler = async (event, context) => {
  if (!calendar.owner(context)) return calendar.json(403, { error: 'Sign in as the calendar owner to book appointments.' });
  if (event.httpMethod === 'GET') {
    try { return calendar.json(200, { bookingToken: calendar.issueBookingToken() }); }
    catch { return calendar.json(503, { error: 'Check your Google Calendar connection and try again.' }); }
  }
  if (event.httpMethod !== 'POST') return calendar.json(405, { error: 'Method not allowed' });
  // Share availability checks, day locks, retry recovery, CRM saving and emails.
  return booking.handler(event);
};
