import React, { useEffect, useMemo, useState } from "react";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n) || 0);

export default function FindEstimates() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/.netlify/functions/list-quotes?limit=100");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load estimates");
        setItems(data.items || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((x) => {
      const hay = `${x.id} ${x.clientName} ${x.projectAddress} ${x.jobType}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  if (loading) return <div>Loading estimates…</div>;
  if (err) return <div style={{ color: "crimson" }}>Error: {err}</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Find Estimates</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, address, id…"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", width: 360 }}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Client</Th>
              <Th>Address</Th>
              <Th>Type</Th>
              <Th>Total</Th>
              <Th>Open</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => (
              <tr key={x.id}>
                <Td>{x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "—"}</Td>
                <Td>{x.clientName || "—"}</Td>
                <Td>{x.projectAddress || "—"}</Td>
                <Td style={{ textTransform: "capitalize" }}>{x.jobType || "—"}</Td>
                <Td>{fmtMoney(x.grandTotal)}</Td>
                <Td>
                  <a href={`/quote/${x.id}`} target="_blank" rel="noreferrer">
                    View
                  </a>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={6} style={{ opacity: 0.7 }}>
                  No estimates found.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee", fontSize: 12, opacity: 0.7 }}>
      {children}
    </th>
  );
}

function Td({ children, ...rest }) {
  return <td style={{ padding: 10, borderBottom: "1px solid #f3f3f3" }} {...rest}>{children}</td>;
}