import React, { useEffect, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { FiUsers, FiEye, FiMousePointer, FiActivity, FiTrendingUp } from "react-icons/fi";
import FindPageSkeleton from "../../Components/FindPageSkeleton";
import "./Metrics.css";

const number = (value) => new Intl.NumberFormat("en-US").format(value || 0);
const periods = { 1: "Today", 7: "Last 7 days", 30: "Last 30 days", 90: "Last 90 days" };
function change(value, before) {
  return before ? `${value >= before ? "+" : ""}${Math.round((value - before) / before * 100)}% vs previous period` : "No previous baseline yet";
}
function Breakdown({ title, items }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return <section className="metrics-panel"><h2>{title}</h2>{items.length ? items.slice(0, 8).map((item) =>
    <div className="metric-breakdown" key={item.name}><div><span>{item.name}</span><strong>{number(item.count)}</strong></div><div className="metric-track"><span style={{ width: `${item.count / max * 100}%` }} /></div></div>
  ) : <p className="metrics-empty">Data will appear as visitors arrive.</p>}</section>;
}

export default function Metrics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [activePoint, setActivePoint] = useState(null);
  useEffect(() => { document.title = "Website Metrics | Brushline CRM"; }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    setActivePoint(null);
    (async () => {
      try {
        const token = await netlifyIdentity.currentUser()?.jwt();
        if (!token) throw new Error("Please log in first.");
        const response = await fetch(`/.netlify/functions/get-site-metrics?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Metrics unavailable");
        if (active) setData(result);
      } catch (failure) { if (active) setError(failure.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [days, refresh]);
  const current = data?.current, previous = data?.previous;
  function exportCsv() {
    const rows = [["Date", "Visitors", "Page views"], ...current.daily.map((day) => [day.day, day.visitors, day.pageviews])];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = `website-metrics-${data.start}-${data.end}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  const insights = [];
  if (current?.pageviews) {
    const mobile = current.devices.find((device) => device.name === "Mobile");
    if (mobile && mobile.count / current.pageviews >= .5) insights.push({ title: "Design for mobile first", text: `${Math.round(mobile.count / current.pageviews * 100)}% of page views come from mobile. Check that phone and quote buttons are easy to tap and the first screen loads quickly.` });
    if (current.pages[0]) insights.push({ title: "Make your busiest page work harder", text: `${current.pages[0].name} attracts the most views. Put a clear service benefit and a prominent contact action near the top, then watch contact-click rate after each change.` });
    if (current.visitors >= 20 && current.contactRate < 5) insights.push({ title: "Test a clearer next step", text: "Fewer than 5% of tracked visitors clicked a contact action. Try a more visible phone number and trust signals near it. This is a testing idea, not a proven diagnosis." });
    if (current.sources[0]) insights.push({ title: "Learn which channels bring interest", text: `Your largest source is ${current.sources[0].name}. Compare the mix after social posts or local search improvements. Direct also includes visits where the referrer is unavailable.` });
  } else insights.push({ title: "Your measurement starts here", text: "Visitor history starts when tracking is deployed. Check back after your first traffic arrives; older visitor totals cannot be reconstructed." });
  const points = current ? days === 1 ? current.hourly.map((hour) => ({ label: `${String(hour.hour).padStart(2, "0")}:00`, date: `${data.end} ${String(hour.hour).padStart(2, "0")}:00 Eastern`, value: hour.pageviews })) : current.daily.map((day) => ({ label: day.day.slice(5), date: day.day, value: day.visitors })) : [];
  const max = Math.max(1, ...points.map((point) => point.value));
  const poly = points.map((point, index) => `${30 + index / Math.max(1, points.length - 1) * 920},${190 - point.value / max * 150}`).join(" ");
  return <div className="metrics-page">
    <header className="metrics-header"><div><span className="metrics-eyebrow">Website performance</span><h1>Metrics</h1><p>Understand your audience. Turn visits into better customer experiences.</p></div><button onClick={() => setRefresh((value) => value + 1)} disabled={loading}>Refresh</button></header>
    <div className="metrics-toolbar"><div className="metrics-periods" role="group" aria-label="Reporting period">{[1, 7, 30, 90].map((period) => <button key={period} aria-pressed={days === period} onClick={() => setDays(period)}>{periods[period]}</button>)}</div><span>Eastern time</span><button disabled={!data || loading} onClick={exportCsv}>Export CSV</button></div>
    {error && <p className="metrics-error" role="alert">{error} <button onClick={() => setRefresh((value) => value + 1)}>Try again</button></p>}
    {loading ? <FindPageSkeleton title="Metrics" /> : current && !error ? <>
      {data.truncated && <p className="metrics-error" role="alert">Counts are incomplete because this period exceeded the reporting limit. Choose a shorter period.</p>}
      <div className="metrics-kpis">{[
        { label: "Visitors", value: current.visitors, before: previous.visitors, icon: <FiUsers />, note: "Distinct tracked browsers" },
        { label: "Visits", value: current.visits, before: previous.visits, icon: <FiActivity />, note: "New visit after 30 minutes idle" },
        { label: "Page views", value: current.pageviews, before: previous.pageviews, icon: <FiEye />, note: "Public marketing pages only" },
        { label: "Contact-click rate", value: `${current.contactRate}%`, icon: <FiMousePointer />, note: `${number(current.contactVisitors)} visitors clicked phone, email, or assistant` },
      ].map((card) => <article className="metric-kpi" key={card.label}><div><span>{card.label}</span>{card.icon}</div><strong>{typeof card.value === "number" ? number(card.value) : card.value}</strong>{card.before !== undefined && <small>{change(card.value, card.before)}</small>}<p>{card.note}</p></article>)}</div>
      <section className="metrics-panel metrics-trend"><div className="metrics-panel-heading"><div><h2>{days === 1 ? "Today, hour by hour" : "Visitor trend"}</h2><p>{data.start} — {data.end} · {days === 1 ? "Page views per hour" : "Unique browsers per day"}</p></div><span className="metrics-tag"><FiTrendingUp /> {periods[days]}</span></div>
        <svg viewBox="0 0 980 230" role="img" aria-label={points.map((point) => `${point.label}: ${point.value}`).join("; ")}>
          {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="30" x2="950" y1={190 - fraction * 150} y2={190 - fraction * 150} stroke="#e2e8f0" /><text x="0" y={194 - fraction * 150} fill="#64748b" fontSize="12">{Math.round(fraction * max)}</text></g>)}
          <polygon points={`30,190 ${poly} 950,190`} fill="#dbeafe" opacity=".65" /><polyline points={poly} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" />
          {points.map((point, index) => index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2) ? <text key={point.label} x={30 + index / Math.max(1, points.length - 1) * 920} y="220" textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fontSize="12" fill="#64748b">{point.label}</text> : null)}
          {points.map((point, index) => {
            const x = 30 + index / Math.max(1, points.length - 1) * 920;
            const width = 920 / Math.max(1, points.length - 1);
            return <g key={point.date} tabIndex="0" role="button" aria-label={`${point.date}: ${number(point.value)} ${days === 1 ? "page views" : "visitors"}`} onMouseEnter={() => setActivePoint(index)} onMouseLeave={() => setActivePoint(null)} onFocus={() => setActivePoint(index)} onBlur={() => setActivePoint(null)} onClick={() => setActivePoint(index)}>
              <rect x={Math.max(0, x - width / 2)} y="25" width={width} height="180" fill="transparent" />
              <circle cx={x} cy={190 - point.value / max * 150} r={activePoint === index ? 6 : 3} fill="#2563eb" pointerEvents="none" />
            </g>;
          })}
          {activePoint !== null && points[activePoint] && <g pointerEvents="none" className="metrics-chart-tooltip"><rect x={Math.min(730, Math.max(10, 30 + activePoint / Math.max(1, points.length - 1) * 920 - 105))} y="0" width="240" height="54" rx="10" fill="#0f172a" /><text x={Math.min(730, Math.max(10, 30 + activePoint / Math.max(1, points.length - 1) * 920 - 105)) + 12} y="21" fill="white" fontSize="13">{points[activePoint].date}</text><text x={Math.min(730, Math.max(10, 30 + activePoint / Math.max(1, points.length - 1) * 920 - 105)) + 12} y="41" fill="#bfdbfe" fontSize="14">{number(points[activePoint].value)} {days === 1 ? "page views" : "visitors"}</text></g>}
        </svg>
        {!current.pageviews && <p className="metrics-empty">No tracked visits in this period yet. Your chart will fill in as visitors arrive.</p>}
      </section>
      <div className="metrics-grid"><Breakdown title="Most visited pages · views" items={current.pages} /><Breakdown title="Traffic sources · views" items={current.sources} /><Breakdown title="Devices · views" items={current.devices} /><Breakdown title="Contact actions · clicks" items={current.actions.map((action) => ({ ...action, name: { phone: "Call phone number", email: "Email link", assistant: "Open project assistant" }[action.name] || action.name }))} /></div>
      <section className="metrics-panel"><h2>Ideas to improve your website</h2><div className="metrics-insights">{insights.map((insight) => <article key={insight.title}><FiTrendingUp /><h3>{insight.title}</h3><p>{insight.text}</p></article>)}</div></section>
      <div className="metrics-method"><strong>How to read these numbers</strong><p>Visitors are estimated unique browsers, not individual people. Today and rolling 7/30/90-day periods include the current partial day and compare with the preceding equal-length period. Charts can count the same browser on multiple days. Contact clicks measure intent, not completed calls or booked jobs. Scroll engagement: {number(current.engagedVisitors)} visitors reached 75% of a page.</p><p>Tracking begins with this release. Signed-in staff, CRM, quote/invoice pages, known bots, Do Not Track and Global Privacy Control browsers are excluded. Storage restrictions and blockers can reduce counts. Referrer data includes domains only; no page query strings, contact details, or IP addresses are stored. Earliest data in this report: {data.observedSince || "Awaiting first event"}. Updated {new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/New_York" })} Eastern.</p></div>
    </> : null}
  </div>;
}
