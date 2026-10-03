const TIMEZONE = 'America/New_York';
const dateKey = (time = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time));
function shiftDay(day, offset) { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); }
function publicPath(path) { return typeof path === 'string' && (/^\/(?:painting|drywall|cleaning|privacy|accessibility|assistant)?$/.test(path) || /^\/service-area\/[a-z0-9-]{1,80}$/.test(path)); }
function summarize(events, start, end) {
  const rows = events.filter(e => e.day >= start && e.day <= end);
  const views = rows.filter(e => e.type === 'pageview');
  const contacts = rows.filter(e => ['phone','email','assistant'].includes(e.type));
  const group = (list, field) => {
    const buckets = {};
    for (const e of list) { const key = e[field] || 'Unknown'; buckets[key] ||= { name: key, count: 0, visitors: new Set() }; buckets[key].count++; buckets[key].visitors.add(e.visitor); }
    return Object.values(buckets).map(b => ({ name: b.name, count: b.count, visitors: b.visitors.size })).sort((a,b) => b.count-a.count);
  };
  const visitorSet = new Set(views.map(e => e.visitor));
  const visitors = visitorSet.size;
  const contactSet = new Set(contacts.filter(e=>visitorSet.has(e.visitor)).map(e=>e.visitor));
  const hourFormat=new Intl.DateTimeFormat('en-US',{timeZone:TIMEZONE,hour:'numeric',hourCycle:'h23'});
  const hours=Array(24).fill(0);
  for(const e of views) hours[Number(hourFormat.format(new Date(e.at)))]++;
  return { visitors, visits: new Set(views.map(e => e.session)).size, pageviews: views.length,
    engagedVisitors: new Set(rows.filter(e => e.type === 'scroll').map(e => e.visitor)).size,
    contactVisitors: contactSet.size, contactClicks: contacts.length,
    contactRate: visitors ? Math.round(contactSet.size / visitors * 1000) / 10 : 0,
    pages: group(views,'path'), sources: group(views,'source'), devices: group(views,'device'), actions: group(contacts,'type'),
    daily: Array.from({length: Math.round((new Date(end)-new Date(start))/86400000)+1}, (_,i) => { const day = shiftDay(start,i); const v = views.filter(e => e.day === day); return { day, visitors: new Set(v.map(e=>e.visitor)).size, pageviews: v.length }; }),
    hourly: Array.from({length:24}, (_,hour) => ({ hour, pageviews: hours[hour] })) };
}
module.exports = { TIMEZONE, dateKey, shiftDay, publicPath, summarize };
